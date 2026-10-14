import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Permitir cargas de hasta 50MB para catálogos y notas
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Directorio para persistencia local del servidor
const DATA_DIR = path.resolve(__dirname, 'data');
const STATE_FILE = path.join(DATA_DIR, 'app_state.json');
const ATTACHMENTS_DIR = path.join(DATA_DIR, 'attachments');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(ATTACHMENTS_DIR)) {
  fs.mkdirSync(ATTACHMENTS_DIR, { recursive: true });
}

// Cargar estado inicial desde disco si existe
let cachedState: any = null;
if (fs.existsSync(STATE_FILE)) {
  try {
    const raw = fs.readFileSync(STATE_FILE, 'utf-8');
    cachedState = JSON.parse(raw);
    console.log('Estado cargado exitosamente desde disco local.');
  } catch (err) {
    console.warn('Error al leer app_state.json existente:', err);
  }
}

// Lista de clientes SSE para sincronización en tiempo real
const sseClients: Response[] = [];

function broadcastState(state: any) {
  const payload = `data: ${JSON.stringify(state)}\n\n`;
  for (let i = sseClients.length - 1; i >= 0; i--) {
    const client = sseClients[i];
    try {
      client.write(payload);
    } catch {
      sseClients.splice(i, 1);
    }
  }
}

// --- Endpoints de la API de Sincronización ---

// 1. Obtener estado actual persistido
app.get('/api/state', (_req: Request, res: Response) => {
  if (cachedState) {
    res.json(cachedState);
  } else if (fs.existsSync(STATE_FILE)) {
    try {
      const raw = fs.readFileSync(STATE_FILE, 'utf-8');
      cachedState = JSON.parse(raw);
      res.json(cachedState);
    } catch {
      res.status(404).json({ error: 'No state found' });
    }
  } else {
    res.status(404).json({ error: 'No state found' });
  }
});

// 2. Guardar estado (desde Admin o cualquier cliente autorizado)
app.post('/api/state', (req: Request, res: Response) => {
  try {
    const incoming = req.body?.state || req.body;
    if (!incoming || typeof incoming !== 'object') {
      res.status(400).json({ error: 'Invalid payload' });
      return;
    }

    // Asegurar fecha de actualización
    const updatedState = {
      ...incoming,
      lastUpdated: incoming.lastUpdated || new Date().toISOString(),
    };

    // Guardar en archivo atómicamente
    const tempFile = `${STATE_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(updatedState, null, 2), 'utf-8');
    fs.renameSync(tempFile, STATE_FILE);

    cachedState = updatedState;

    // Notificar inmediatamente a todas las pantallas y dispositivos conectados
    broadcastState(cachedState);

    res.json({
      success: true,
      lastUpdated: updatedState.lastUpdated,
      assignmentsCount: Object.keys(updatedState.assignments || {}).length,
    });
  } catch (err: any) {
    console.error('Error al guardar estado en el servidor:', err);
    res.status(500).json({ error: err?.message || 'Failed to save state' });
  }
});

// 3. Canal SSE en vivo para sincronizar todos los teléfonos/pantallas sin tocar cuota de Firebase
app.get('/api/state/stream', (_req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write('\n');

  // Enviar estado actual si existe
  if (cachedState) {
    res.write(`data: ${JSON.stringify(cachedState)}\n\n`);
  }

  sseClients.push(res);

  _req.on('close', () => {
    const idx = sseClients.indexOf(res);
    if (idx !== -1) {
      sseClients.splice(idx, 1);
    }
  });
});

// 4. Adjuntos y partituras pesadas
app.get('/api/attachments/:id', (req: Request, res: Response) => {
  const cleanId = String(req.params.id || '').replace(/[^a-zA-Z0-9_-]/g, '');
  const filePath = path.join(ATTACHMENTS_DIR, `${cleanId}.json`);
  if (fs.existsSync(filePath)) {
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      res.json(JSON.parse(data));
      return;
    } catch {
      // continuar
    }
  }
  res.status(404).json({ error: 'Attachment not found' });
});

app.post('/api/attachments/:id', (req: Request, res: Response) => {
  try {
    const cleanId = String(req.params.id || '').replace(/[^a-zA-Z0-9_-]/g, '');
    const filePath = path.join(ATTACHMENTS_DIR, `${cleanId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(req.body), 'utf-8');
    res.json({ success: true, id: cleanId });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to save attachment' });
  }
});

// --- Integración con Vite / Frontend ---
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Corriendo en http://0.0.0.0:${PORT} (${isProd ? 'producción' : 'desarrollo'})`);
  });
}

startServer().catch(err => {
  console.error('[Server] Error al iniciar servidor:', err);
  process.exit(1);
});
