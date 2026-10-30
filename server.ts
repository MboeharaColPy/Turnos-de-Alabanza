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

// Directorio para persistencia local del servidor y copias de seguridad automáticas
const DATA_DIR = path.resolve(__dirname, 'data');
const STATE_FILE = path.join(DATA_DIR, 'app_state.json');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
const ATTACHMENTS_DIR = path.join(DATA_DIR, 'attachments');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}
if (!fs.existsSync(ATTACHMENTS_DIR)) {
  fs.mkdirSync(ATTACHMENTS_DIR, { recursive: true });
}

function countAssignments(state: any): number {
  if (!state || !state.assignments || typeof state.assignments !== 'object') return 0;
  return Object.keys(state.assignments).reduce((acc, k) => {
    return acc + Object.keys(state.assignments[k] || {}).length;
  }, 0);
}

// Cargar estado inicial desde disco o respaldos
let cachedState: any = null;
if (fs.existsSync(STATE_FILE)) {
  try {
    const raw = fs.readFileSync(STATE_FILE, 'utf-8');
    cachedState = JSON.parse(raw);
    console.log(`[Server] Estado cargado desde app_state.json (${countAssignments(cachedState)} asignaciones).`);
  } catch (err) {
    console.warn('[Server] Error al leer app_state.json existente:', err);
  }
}

// Si app_state.json estaba vacío o con 0 asignaciones, buscar en los respaldos automáticos
if (countAssignments(cachedState) === 0 && fs.existsSync(BACKUPS_DIR)) {
  try {
    const backupFiles = fs.readdirSync(BACKUPS_DIR)
      .filter(f => f.endsWith('.json'))
      .sort()
      .reverse();
    for (const bFile of backupFiles) {
      try {
        const bData = JSON.parse(fs.readFileSync(path.join(BACKUPS_DIR, bFile), 'utf-8'));
        const bCount = countAssignments(bData);
        if (bCount > 0) {
          cachedState = bData;
          fs.writeFileSync(STATE_FILE, JSON.stringify(bData, null, 2), 'utf-8');
          console.log(`[Server] Estado restaurado automáticamente desde respaldo ${bFile} (${bCount} asignaciones).`);
          break;
        }
      } catch {
        // continuar al siguiente
      }
    }
  } catch (bErr) {
    console.warn('[Server] Error buscando respaldos:', bErr);
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

// Función auxiliar para rotación de respaldos en disco
function saveDiskBackup(state: any) {
  try {
    const assignCount = countAssignments(state);
    if (assignCount === 0) return;
    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilePath = path.join(BACKUPS_DIR, `backup_${timestampStr}_${assignCount}assign.json`);
    fs.writeFileSync(backupFilePath, JSON.stringify(state, null, 2), 'utf-8');

    // Mantener sólo los últimos 20 respaldos en disco
    const existing = fs.readdirSync(BACKUPS_DIR).filter(f => f.startsWith('backup_') && f.endsWith('.json')).sort();
    if (existing.length > 20) {
      const toRemove = existing.slice(0, existing.length - 20);
      toRemove.forEach(f => {
        try { fs.unlinkSync(path.join(BACKUPS_DIR, f)); } catch {}
      });
    }
  } catch (err) {
    console.warn('[Server] Error guardando respaldo en disco:', err);
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

    const currentAssignments = countAssignments(cachedState);
    const incomingAssignments = countAssignments(incoming);

    // PROTECCIÓN CONTRA BORRADO ACCIDENTAL:
    // Si el servidor ya tiene asignaciones y el payload entrante viene con 0 asignaciones,
    // rechazar el reemplazo a menos que venga con 'explicitEmptyReset: true'
    if (currentAssignments > 0 && incomingAssignments === 0 && !req.body?.explicitEmptyReset && !incoming._explicitEmptyReset) {
      console.warn(`[Server] Rechazado intento de sobreescribir ${currentAssignments} asignaciones con un estado vacío.`);
      res.status(409).json({
        error: 'Refusing to overwrite existing assignments with empty state',
        currentAssignmentsCount: currentAssignments,
        cachedState,
      });
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

    // Crear copia de seguridad rotativa si contiene asignaciones
    if (incomingAssignments > 0) {
      saveDiskBackup(updatedState);
    }

    // Notificar inmediatamente a todas las pantallas y dispositivos conectados
    broadcastState(cachedState);

    res.json({
      success: true,
      lastUpdated: updatedState.lastUpdated,
      assignmentsCount: incomingAssignments,
    });
  } catch (err: any) {
    console.error('Error al guardar estado en el servidor:', err);
    res.status(500).json({ error: err?.message || 'Failed to save state' });
  }
});

// Endpoint para consultar respaldos disponibles en disco
app.get('/api/backups', (_req: Request, res: Response) => {
  try {
    if (!fs.existsSync(BACKUPS_DIR)) {
      res.json([]);
      return;
    }
    const files = fs.readdirSync(BACKUPS_DIR)
      .filter(f => f.endsWith('.json'))
      .map(file => {
        const stats = fs.statSync(path.join(BACKUPS_DIR, file));
        return {
          filename: file,
          size: stats.size,
          modified: stats.mtime.toISOString(),
        };
      })
      .sort((a, b) => b.modified.localeCompare(a.modified));
    res.json(files);
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

// Endpoint para restaurar un respaldo del disco
app.post('/api/backups/restore', (req: Request, res: Response) => {
  try {
    const filename = req.body?.filename;
    let targetFile = '';
    if (filename) {
      const cleanName = path.basename(String(filename));
      targetFile = path.join(BACKUPS_DIR, cleanName);
    } else {
      // Tomar el respaldo con más asignaciones
      const files = fs.readdirSync(BACKUPS_DIR).filter(f => f.endsWith('.json'));
      let bestFile = '';
      let maxCount = -1;
      for (const f of files) {
        try {
          const content = JSON.parse(fs.readFileSync(path.join(BACKUPS_DIR, f), 'utf-8'));
          const count = countAssignments(content);
          if (count > maxCount) {
            maxCount = count;
            bestFile = f;
          }
        } catch {}
      }
      if (bestFile) {
        targetFile = path.join(BACKUPS_DIR, bestFile);
      }
    }

    if (!targetFile || !fs.existsSync(targetFile)) {
      res.status(404).json({ error: 'No valid backup found to restore' });
      return;
    }

    const backupData = JSON.parse(fs.readFileSync(targetFile, 'utf-8'));
    backupData.lastUpdated = new Date().toISOString();

    fs.writeFileSync(STATE_FILE, JSON.stringify(backupData, null, 2), 'utf-8');
    cachedState = backupData;
    broadcastState(cachedState);

    res.json({
      success: true,
      restoredFrom: path.basename(targetFile),
      assignmentsCount: countAssignments(backupData),
      state: backupData,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
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
