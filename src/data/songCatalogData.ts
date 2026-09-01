import { SongItem } from '../types';

export const OFFICIAL_SONG_LIST: { title: string; artist: string }[] = [
  { title: "10.000 Razones", artist: "Su Presencia" },
  { title: "A quien iré", artist: "Marcos Witt" },
  { title: "A Ti", artist: "Marcos Witt" },
  { title: "Abba Padre", artist: "Marco Barrientos" },
  { title: "Abre los cielos", artist: "Jesús Adrián Romero" },
  { title: "Agnus Dei", artist: "Marco Barrientos" },
  { title: "Aguas Profundas", artist: "Marcos Brunet" },
  { title: "Al alto y sublime", artist: "Roberto Torres" },
  { title: "Al estar ante tí", artist: "Alejandro del Bosque" },
  { title: "Al estar aquí", artist: "Danilo Montero" },
  { title: "Al que es digno", artist: "Coalo Zamorano" },
  { title: "Al que es digno", artist: "Marcos Witt" },
  { title: "Al que esta sentado en el trono", artist: "Toma tu Lugar" },
  { title: "Al que me ciñe", artist: "Jesús Adrián Romero" },
  { title: "Alabadle", artist: "Marcos Witt" },
  { title: "Amor sin condición", artist: "Twice" },
  { title: "Anciano de días", artist: "Luigi Castro" },
  { title: "Aquel quien la buena obra empezó", artist: "Steve Green" },
  { title: "Aquí estoy", artist: "Jaime Murrell" },
  { title: "Asombroso Dios", artist: "Hillsong United" },
  { title: "Atraeme a tí", artist: "Luigi Castro" },
  { title: "Bendito sea el Señor", artist: "Palabra en Acción" },
  { title: "Bendito sea Jehová la roca", artist: "Misioneros de Cristo" },
  { title: "Buen buen padre", artist: "Chris Tomlin" },
  { title: "Bueno es alabar", artist: "Danilo Montero" },
  { title: "Bueno es Dios", artist: "Don Moen" },
  { title: "Cada mañana", artist: "Jesús Adrián Romero" },
  { title: "Calvario", artist: "Hillsong United" },
  { title: "Canta al señor", artist: "Ingrid Rosario" },
  { title: "Cantaré de Tu Amor", artist: "Danilo Montero" },
  { title: "Cantaré de tu amor por siempre", artist: "Hillsong United" },
  { title: "Canto y danzo", artist: "Cfamusic" },
  { title: "Cantos de Júbilo", artist: "Jaime Murrell" },
  { title: "Celebra victorioso", artist: "Juan Carlos Alvarado" },
  { title: "Celebraré tu amor", artist: "Jesús Adrián Romero" },
  { title: "Cerca de tí", artist: "Jesús Adrián Romero" },
  { title: "Como en el cielo", artist: "Miel San Marcos" },
  { title: "Con mis manos levantadas", artist: "Danilo Montero" },
  { title: "Conozco que todo lo puedes", artist: "Juan Carlos Alvarado" },
  { title: "Contempla a Dios", artist: "Sovereign Grace Music" },
  { title: "Cordero Santo", artist: "Marco Barrientos" },
  { title: "Cordero y León", artist: "Evan Craft" },
  { title: "Coritos Medley", artist: "Israel Houghton" },
  { title: "Creo en tí", artist: "Julio Melgar" },
  { title: "Cristo no está muerto", artist: "Juan Carlos Alvarado" },
  { title: "Cristo yo te amo", artist: "Vino Nuevo" },
  { title: "Cuan bello es el Señor", artist: "Marcos Witt" },
  { title: "Cuan grande es Dios", artist: "En Espiritu y en Verdad" },
  { title: "Cuan grande es el", artist: "Cristal Lewis" },
  { title: "Cuerdas de amor", artist: "Julio Melgar" },
  { title: "Damos Honor a Tí", artist: "Danilo Montero" },
  { title: "De gloria en gloria", artist: "Marco Barrientos" },
  { title: "De gloria en gloria", artist: "Marcos Witt" },
  { title: "De tal manera me amó", artist: "Marco Barrientos" },
  { title: "Desde mi interior", artist: "Hillsong United" },
  { title: "Deseable", artist: "Marcos Brunet" },
  { title: "Digno", artist: "Marcos Brunet" },
  { title: "Digno de gloria", artist: "Coalo Zamorano" },
  { title: "Digno eres Señor", artist: "Marco Barrientos" },
  { title: "Digno y santo", artist: "Kari Jobe" },
  { title: "Dios de gloria", artist: "Vertical" },
  { title: "Dios de lo imposible", artist: "Marco Barrientos" },
  { title: "Dios de pactos", artist: "Marcos Witt" },
  { title: "Dios el más grande", artist: "Palabra en Acción" },
  { title: "Dios Eterno", artist: "Hillsong United" },
  { title: "Dios ha sido bueno", artist: "Marcos Witt" },
  { title: "Dios Imparable", artist: "Marcos Witt" },
  { title: "Dios Incomparable", artist: "Generación 12" },
  { title: "Dios me ama", artist: "Danilo Montero" },
  { title: "Dios no está muerto", artist: "Miel San Marcos" },
  { title: "Dios Poderoso", artist: "La IBI" },
  { title: "Dios subió", artist: "Jaime Murrell" },
  { title: "Dios, desciende aquí", artist: "Marcos Witt" },
  { title: "Doxologia", artist: "Marcos Witt" },
  { title: "Dulce refugio", artist: "Danilo Montero" },
  { title: "El cielo gobierna", artist: "David Scarpeta" },
  { title: "El cordero y el león", artist: "Twice" },
  { title: "El Dios que adoramos", artist: "Sovereign Grace Music" },
  { title: "El es el Rey", artist: "Danilo Montero" },
  { title: "El granito de mostaza", artist: "Música Católica" },
  { title: "El señor es mi pastor", artist: "Danilo Montero" },
  { title: "El Señor es mi rey", artist: "Miel San Marcos" },
  { title: "El señor está en este lugar", artist: "Marco Barrientos" },
  { title: "El tiempo de cantar", artist: "Claudio Freidzon" },
  { title: "El victorioso", artist: "Juan Carlos Alvarado" },
  { title: "En el monte calvario", artist: "Luis Enrique Espinoza" },
  { title: "En la cruz", artist: "Hillsong United" },
  { title: "En la cruz", artist: "Himnos de Gloria y Triunfo" },
  { title: "En los montes, en los valles", artist: "Marcos Witt" },
  { title: "En Tí", artist: "Coalo Zamorano" },
  { title: "En ti estoy firme", artist: "Bethel Music" },
  { title: "Enciende Una Luz", artist: "Marcos Witt" },
  { title: "Entra en la presencia", artist: "Palabra en Acción" },
  { title: "Enviame a mi", artist: "Jesús Adrián Romero" },
  { title: "Eres", artist: "Roger Osorio" },
  { title: "Eres Increíble", artist: "Miel San Marcos" },
  { title: "Eres mi amigo fiel", artist: "Coalo Zamorano" },
  { title: "Eres Rey", artist: "Coalo Zamorano" },
  { title: "Eres rey de los cielos", artist: "Marco Barrientos" },
  { title: "Eres Señor", artist: "Visión Juvenil" },
  { title: "Eres Todopoderoso", artist: "Danilo Montero" },
  { title: "Eres Tú", artist: "Danilo Montero" },
  { title: "Es aquí, es ahora", artist: "Marcos Witt" },
  { title: "Es Jesús", artist: "Danilo Montero" },
  { title: "Es Tiempo", artist: "Hillsong United" },
  { title: "Escucharte hablar", artist: "Marcos Witt" },
  { title: "Esperar en ti", artist: "Jesús Adrián Romero" },
  { title: "Espiritu de Dios", artist: "Música Religiosa" },
  { title: "Eterno", artist: "Christine D'clario" },
  { title: "Exáltate", artist: "Marcos Witt" },
  { title: "Fidelidad", artist: "Christine d'Clario" },
  { title: "Fiesta hay en el corazón", artist: "Danilo Montero" },
  { title: "Fue en la cruz", artist: "Danilo Montero" },
  { title: "Fuerte Dios (Dios te exalto)", artist: "Música Católica" },
  { title: "Galileo", artist: "GDS Band" },
  { title: "Glorioso Día", artist: "Passion" },
  { title: "Goliat", artist: "Su Presencia" },
  { title: "Gracia sublime es", artist: "Evan Craft" },
  { title: "Gracias", artist: "Marcos Witt" },
  { title: "Gracias Cristo", artist: "Hillsong United" },
  { title: "Grande y fuerte", artist: "Miel San Marcos" },
  { title: "Grandes Cosas", artist: "Marcos Witt" },
  { title: "Grandes son tus maravillas", artist: "Jaime Murrell" },
  { title: "Grandes y Maravillosas", artist: "Grupo manantial" },
  { title: "Has Aumentado", artist: "Danilo Montero" },
  { title: "Has cambiado mi lamento en baile", artist: "Marcos Witt" },
  { title: "Has Ganado", artist: "Marco Barrientos" },
  { title: "Hasta que no respire mas", artist: "Rojo" },
  { title: "Hay Libertad", artist: "Art Aguilera" },
  { title: "Hay Libertad", artist: "La IBI" },
  { title: "Hay Momentos", artist: "Danilo Montero" },
  { title: "He decidido seguir a Cristo", artist: "Música Cristiana" },
  { title: "Heme Aquí", artist: "Jesús Adrián Romero" },
  { title: "Heme Aquí", artist: "Marco Barrientos" },
  { title: "Hermoso Eres", artist: "Marcos Witt" },
  { title: "Hermoso Nombre", artist: "Hillsong United" },
  { title: "Hosanna en las alturas", artist: "Coalo Zamorano" },
  { title: "Hossana", artist: "Hillsong United" },
  { title: "Hossana", artist: "Marco Barrientos" },
  { title: "Inagotable", artist: "Living" },
  { title: "Jesucristo Basta", artist: "Un Corazón" },
  { title: "Jesús en el centro", artist: "Coalo Zamorano" },
  { title: "Jesús eres mi buen pastor", artist: "Marcos Witt" },
  { title: "Jesús es el Señor", artist: "Jesús Adrián Romero" },
  { title: "Jesús mi fiel amigo", artist: "Abel Zavala" },
  { title: "Junto a tus Pies", artist: "Danilo Montero" },
  { title: "La bondad de Dios", artist: "Gateway Worship" },
  { title: "La casa de Dios", artist: "Danilo Montero" },
  { title: "La Cosecha", artist: "Marcos Witt" },
  { title: "La generación que danza", artist: "En Espiritu y en Verdad" },
  { title: "La sombra de tus alas", artist: "Living" },
  { title: "La ultima palabra", artist: "Daniel Calveti" },
  { title: "Lávame", artist: "Marcos Witt" },
  { title: "Le llaman guerrero", artist: "Juan Carlos Alvarado" },
  { title: "Levántate Señor", artist: "Paul Wilbur" },
  { title: "Levantate y Salvame", artist: "Marcos Witt" },
  { title: "Llename Señor", artist: "Marcos Witt" },
  { title: "Lo harás otra vez", artist: "Elevation Worship" },
  { title: "Lo único que quiero", artist: "Abel Zavala" },
  { title: "Lo único que quiero", artist: "Marco Barrientos" },
  { title: "Los que llevan buenas nuevas", artist: "Santiago Benavides" },
  { title: "Luz de mi vida", artist: "Marcos Witt" },
  { title: "Majestuoso", artist: "Miguel Balboa" },
  { title: "Majestuoso, Poderoso", artist: "Marcos Witt" },
  { title: "Mas el Dios de toda gracia", artist: "Marcos Witt" },
  { title: "Más Que Palabras", artist: "Marcos Witt" },
  { title: "Me Gozaré", artist: "Juan Carlos Alvarado" },
  { title: "Me gusta estar en tu casa", artist: "Danilo Montero" },
  { title: "Medley II", artist: "Majo Solís" },
  { title: "Mi casa y yo", artist: "Tercer Cielo" },
  { title: "Mi corona es Jesús", artist: "Puente Largo" },
  { title: "Mi Dios", artist: "Rojo" },
  { title: "Mi fortaleza", artist: "Freddy Rodriguez" },
  { title: "Mi pan, mi luz", artist: "Marcos Witt" },
  { title: "Mi Primer Amor", artist: "Marcos Witt" },
  { title: "Mil Gracias", artist: "Juan Carlos Alvarado" },
  { title: "Nada es imposible", artist: "Marco Barrientos" },
  { title: "No Basta", artist: "Juan Carlos Alvarado" },
  { title: "No hay lugar más alto", artist: "Miel San Marcos" },
  { title: "No me soltarás", artist: "Rojo" },
  { title: "Nuestro Dios", artist: "En Espiritu y en Verdad" },
  { title: "Océanos (donde mis pies pueden fallar)", artist: "Hillsong United" },
  { title: "Oh Jesús", artist: "Marcos Witt" },
  { title: "Oh moradora de sion", artist: "Jaime Murrell" },
  { title: "Oh tu fidelidad", artist: "Steve Green" },
  { title: "Padre Nuestro", artist: "Bethel Music" },
  { title: "Palabras de vida eterna", artist: "Marcos Witt" },
  { title: "Perfume a tus pies", artist: "En Espiritu y en Verdad" },
  { title: "Poderoso para salvar", artist: "Hillsong United" },
  { title: "Poema de salvación", artist: "Pablo Olivares" },
  { title: "Pon Aceite En Mi Vida", artist: "Jaime Murrell" },
  { title: "Pon tu mirada", artist: "Sovereign Grace Music" },
  { title: "Por quien eres tú", artist: "Coalo Zamorano" },
  { title: "Por Siempre", artist: "Evan Craft" },
  { title: "Por tu sangre", artist: "Marcos Witt" },
  { title: "Porque bueno es Dios", artist: "Jaime Murrell" },
  { title: "Porque el Señor todopoderoso reina", artist: "Marco Barrientos" },
  { title: "Porque el vive", artist: "Jehová Nisi" },
  { title: "Porque tu eres bueno", artist: "Marcos Witt" },
  { title: "Porque tú eres rey de reyes", artist: "Palabra en Acción" },
  { title: "Principio y fín", artist: "Evan Craft" },
  { title: "Protegido bajo tus alas", artist: "Música Religiosa" },
  { title: "Pues tú glorioso eres Señor", artist: "Juan Carlos Alvarado" },
  { title: "Purificame", artist: "Marcos Witt" },
  { title: "Que se llene tu casa", artist: "Ingrid Rosario" },
  { title: "Que sería de mí", artist: "Jesús Adrián Romero" },
  { title: "Quién nos separa?", artist: "Juan Carlos Alvarado" },
  { title: "Quiero agradecerte", artist: "Abel Zavala" },
  { title: "Quiero alabarte", artist: "Música Religiosa" },
  { title: "Quiero conocer a Jesús (Yeshua) - nuestro Dios", artist: "Generación 12" },
  { title: "Quiero estar contigo", artist: "Jaime Murrell" },
  { title: "Quiero Levantar mis Manos", artist: "Marcos Witt" },
  { title: "Remolineando", artist: "Fernel Monroy" },
  { title: "Renuévame", artist: "Marcos Witt" },
  { title: "Resplandece", artist: "Palabra en Acción" },
  { title: "Revelación", artist: "Danilo Montero" },
  { title: "Rey", artist: "Christine d'Clario" },
  { title: "Rey de gloria", artist: "Marco Barrientos" },
  { title: "Rey de majestad", artist: "Hillsong United" },
  { title: "Rey de reyes", artist: "Visión Juvenil" },
  { title: "Salmo 126", artist: "Música Religiosa" },
  { title: "Salmo 84", artist: "Danilo Montero" },
  { title: "Sana nuestra tierra", artist: "Marcos Witt" },
  { title: "Santo de gloria", artist: "Música Católica" },
  { title: "Santo es el que vive", artist: "Montesanto" },
  { title: "Santo es el Señor", artist: "Juan Carlos Alvarado" },
  { title: "Santo por siempre", artist: "La IBI" },
  { title: "Santo santo santo", artist: "Marcos Witt" },
  { title: "Santo, santo tú eres", artist: "Grupo manantial" },
  { title: "Sencilla", artist: "Santiago Benavides" },
  { title: "Sendas Dios hará", artist: "Don Moen" },
  { title: "Señor Eres Fiel", artist: "Marco Barrientos" },
  { title: "Señor hazme un radical", artist: "Marcos Witt" },
  { title: "Señor llévame a tus atrios", artist: "Danilo Montero" },
  { title: "Sentado en su trono", artist: "Jesús Adrián Romero" },
  { title: "Sin Reservas", artist: "Marco Barrientos" },
  { title: "Sobrenatural", artist: "Marcos Witt" },
  { title: "Somos el pueblo de Dios", artist: "Marcos Witt" },
  { title: "Somos Iglesia", artist: "Un Corazón" },
  { title: "Somos tu iglesia", artist: "Generación 12" },
  { title: "Soy nueva criatura", artist: "Jesús Adrián Romero" },
  { title: "Sublime Gracia", artist: "En Espiritu y en Verdad" },
  { title: "Superheroe", artist: "Xtreme Kids" },
  { title: "Te alabaran oh Jehová todos los reyes", artist: "Stanislao Marino" },
  { title: "Te Alabaré mi buen Jesús", artist: "Danilo Montero" },
  { title: "Te Amo", artist: "Juan Carlos Alvarado" },
  { title: "Te amo Jesús", artist: "Daniel Calveti" },
  { title: "Te daré lo mejor", artist: "Jesús Adrián Romero" },
  { title: "Te doy gloria", artist: "En Espiritu y en Verdad" },
  { title: "Te Exaltamos", artist: "Marcos Witt" },
  { title: "Te exaltare mi Dios mi rey", artist: "Elim" },
  { title: "Te pido la paz", artist: "Jaime Murrell" },
  { title: "Te Seguiré", artist: "Yashira Guidini" },
  { title: "Te vengo a bendecir", artist: "Jesús Adrián Romero" },
  { title: "Te vengo a decir", artist: "Alex Campos" },
  { title: "Temprano yo te buscaré", artist: "Marcos Witt" },
  { title: "Todo lo has cambiado", artist: "Danilo Montero" },
  { title: "Todo lo que respira", artist: "Danilo Montero" },
  { title: "Tómalo", artist: "Hillsong United" },
  { title: "Tu amor no tiene fín", artist: "Generación 12" },
  { title: "Tu amor por mi", artist: "Marcos Witt" },
  { title: "Tu eres digno de gloria", artist: "Gerry Márquez" },
  { title: "Tu eres rey", artist: "Barak" },
  { title: "Tu eres rey", artist: "Danilo Montero" },
  { title: "Tu estás aquí", artist: "Jesús Adrián Romero" },
  { title: "Tu fidelidad", artist: "Marcos Witt" },
  { title: "Tu gracia es suficiente", artist: "Danilo Montero" },
  { title: "Tu habitas", artist: "Marco Barrientos" },
  { title: "Tú Harás", artist: "Marcos Witt" },
  { title: "Tu has cambiado mi lamento", artist: "Paul Wilbur" },
  { title: "Tu has sido fiel", artist: "Jesús Adrián Romero" },
  { title: "Tu mirada", artist: "Marcos Witt" },
  { title: "Tu Nombre", artist: "Miel San Marcos" },
  { title: "Tu nombre levantare", artist: "Cumplidores de promesas" },
  { title: "Tu nombre oh Dios", artist: "Marcos Witt" },
  { title: "Tu Palabra", artist: "Juan Carlos Alvarado" },
  { title: "Tu presencia es el cielo", artist: "Israel Houghton" },
  { title: "Un Adorador", artist: "Marcos Witt" },
  { title: "Un destello de tu gloria", artist: "Jesús Adrián Romero" },
  { title: "Un siervo para su gloria", artist: "La IBI" },
  { title: "Vamos a cantar", artist: "En Espiritu y en Verdad" },
  { title: "Vasijas Rotas", artist: "Hillsong United" },
  { title: "Ven Espiritu Ven", artist: "Marco Barrientos" },
  { title: "Ven, es hora de adorarle", artist: "Marco Barrientos" },
  { title: "Venció", artist: "Marcos Witt" },
  { title: "Venga tu reino", artist: "Hillsong United" },
  { title: "Venimos ante tí", artist: "Marco Barrientos" },
  { title: "Vine a adorar a Dios", artist: "Alabanzas Llamada Final" },
  { title: "Vine a adorarte", artist: "Marcela Gandara" },
  { title: "Vives en mí", artist: "Evan Craft" },
  { title: "Vuelvo a Casa", artist: "Generación 12" },
  { title: "Way Maker", artist: "Priscilla Bueno" },
  { title: "Yo iré", artist: "Miel San Marcos" },
  { title: "Yo Quiero", artist: "Tonchy Oropeza" },
  { title: "Yo quiero más de Tí", artist: "Jaime Murrell" },
  { title: "Yo También", artist: "Twice" },
  { title: "Yo te entrego mi ser", artist: "Luis Campos" },
  { title: "Yo vine a alabar a Dios", artist: "Misioneros de Cristo" },
  { title: "Pueblos Todos Batid Las Manos / Se Detuvo El Sol / Esta Es La Iglesia Del Señor", artist: "Coros Celestiales" }
];

// Recent songs added in the last 2 days (2026-08-31 to 2026-09-01) with clean American chords
const RECENT_SONGS_MAP: Record<string, { key: string; bpm: number; category: string; lyrics: string; createdAt: string }> = {
  "10.000 Razones": {
    key: "G",
    bpm: 73,
    category: "Adoración",
    createdAt: "2026-08-31T14:30:00.000Z",
    lyrics: `[Coro]
C        G        D       Em        C
Que todo lo que soy alabe al Señor, con todo mi corazón
G        D           C   Em
De Su grande amor cantaré, alaba al Señor
C     D      G
Alaba a Dios, oh alma mía

[Estrofa 1]
         C           G
Sale el sol, es un nuevo amanecer
D         Em
Cantaré a Ti otra vez
C          G             D         Em
Sea lo que venga y lo que esté por delante
C           G             D    G
Cantaré al llegar el atardecer

[Estrofa 2]
         C             G
Tu amor no tiene fin, grande es Tu bondad
D            Em
Tu Nombre dulce es y digno de alabar
C          G              D        Em
Por todo lo que has hecho cantaré por siempre
C              G              D      G
Diez mil razones para Tu amor cantar`
  },
  "Cuan grande es Dios": {
    key: "G",
    bpm: 78,
    category: "Adoración",
    createdAt: "2026-09-01T08:00:00.000Z",
    lyrics: `[Intro]
G   Em7   C2   D

[Estrofa 1]
    G                          Em7
El rey de majestad, vestido en majestad
                 C2
La tierra gozo tendrá, la tierra gozo tendrá
    G                       Em7
El se cubre con la luz, huye la oscuridad
               C2
Al escuchar Su voz, al escuchar Su voz

[Coro]
      G
Cuan grande es Dios, cántale
      Em7
Cuan grande es Dios, y todos lo verán
      C2           D          G
Cuan grande, cuan grande es Dios

[Estrofa 2]
    G                           Em7
De edad en edad El es, el tiempo en Sus manos está
               C2
Principio y el fin, principio y el fin
    G                     Em7
La Trinidad en Dios, Padre Hijo y Espíritu
               C2
Cordero y el León, Cordero y el León

[Puente]
    G
Tu Nombre sobre todo es
    Em7
Tu eres digno de alabar
      C2             D          G
Y mi ser cantará, cuan grande es Dios`
  },
  "Pueblos Todos Batid Las Manos / Se Detuvo El Sol / Esta Es La Iglesia Del Señor": {
    key: "Dm",
    bpm: 130,
    category: "Júbilo",
    createdAt: "2026-09-01T09:15:00.000Z",
    lyrics: `[Intro]
Dm   A7   Dm   A7   Dm

[Parte 1: Pueblos Todos Batid Las Manos]
Dm
Pueblos todos batid las manos
A7                 Dm
Alabad al Dios de Israel
Dm
Pueblos todos batid las manos
A7                 Dm
Alabad al Dios de Israel

[Coro 1]
Gm                Dm
Cantad a Dios, cantad
A7                    Dm
Cantad a nuestro Rey, cantad
Gm                Dm
Porque Dios es el Rey de toda la tierra
A7               Dm
Cantad a Dios alabanza

[Parte 2: Se Detuvo El Sol]
Dm                    A7
Allá en Gabaón el sol se detuvo
                       Dm
Y en el valle de Ajalón la luna paró
Dm                    A7
Allá en Gabaón el sol se detuvo
                       Dm
Y en el valle de Ajalón la luna paró

[Coro 2]
Gm                 Dm
Porque Josué oraba, porque Josué creía
A7                    Dm
Y el Dios de los cielos la victoria daba
Gm                 Dm
Porque Josué oraba, porque Josué creía
A7                    Dm
Y el Dios de los cielos la victoria daba

[Parte 3: Esta Es La Iglesia Del Señor]
Dm                       A7
Esta es la iglesia del Señor
                         Dm
Casa de Dios, puerta del cielo
Dm                       A7
Esta es la iglesia del Señor
                         Dm
Casa de Dios, puerta del cielo

[Final]
Gm                Dm
Él la llamó para alabanza de Su Nombre
A7                    Dm
Para que todos conozcan Su poder
Dm   A7   Dm`
  }
};

export const INITIAL_FULL_SONG_CATALOG: SongItem[] = OFFICIAL_SONG_LIST.map((item, index) => {
  const recent = RECENT_SONGS_MAP[item.title];
  if (recent) {
    return {
      id: `cat_song_${index + 1}`,
      title: item.title,
      artist: item.artist,
      artists: [item.artist],
      key: recent.key,
      bpm: recent.bpm,
      category: recent.category,
      timeSignature: '4/4',
      lyrics: recent.lyrics,
      notes: '',
      createdAt: recent.createdAt,
      updatedAt: recent.createdAt,
    };
  }

  // Las demás canciones quedan completamente en blanco en letra y notas
  return {
    id: `cat_song_${index + 1}`,
    title: item.title,
    artist: item.artist,
    artists: [item.artist],
    key: '',
    bpm: undefined,
    category: 'General',
    timeSignature: '4/4',
    lyrics: '',
    notes: '',
    createdAt: '2026-08-20T10:00:00.000Z',
    updatedAt: '2026-08-20T10:00:00.000Z',
  };
});
