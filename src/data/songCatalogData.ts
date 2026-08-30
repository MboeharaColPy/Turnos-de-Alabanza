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

const SAMPLE_LYRICS_MAP: Record<string, { key: string; lyrics: string }> = {
  "Pueblos Todos Batid Las Manos / Se Detuvo El Sol / Esta Es La Iglesia Del Señor": {
    key: "Rem",
    lyrics: `[Intro]
[Rem]  [La7]  [Rem]  [La7]  [Rem]

[Parte 1: Pueblos Todos Batid Las Manos]
[Rem]
Pueblos todos batid las manos
[La7]               [Rem]
Alabad al Dios de Israel
[Rem]
Pueblos todos batid las manos
[La7]               [Rem]
Alabad al Dios de Israel

[Coro 1]
[Solm]             [Rem]
Cantad a Dios, cantad
[La7]                  [Rem]
Cantad a nuestro Rey, cantad
[Solm]             [Rem]
Porque Dios es el Rey de toda la tierra
[La7]            [Rem]
Cantad a Dios alabanza

[Parte 2: Se Detuvo El Sol]
[Rem]                  [La7]
Allá en Gabaón el sol se detuvo
                     [Rem]
Y en el valle de Ajalón la luna paró
[Rem]                  [La7]
Allá en Gabaón el sol se detuvo
                     [Rem]
Y en el valle de Ajalón la luna paró

[Coro 2]
[Solm]              [Rem]
Porque Josué oraba, porque Josué creía
[La7]                  [Rem]
Y el Dios de los cielos la victoria daba
[Solm]              [Rem]
Porque Josué oraba, porque Josué creía
[La7]                  [Rem]
Y el Dios de los cielos la victoria daba

[Parte 3: Esta Es La Iglesia Del Señor]
[Rem]                     [La7]
Esta es la iglesia del Señor
                      [Rem]
Casa de Dios, puerta del cielo
[Rem]                     [La7]
Esta es la iglesia del Señor
                      [Rem]
Casa de Dios, puerta del cielo

[Final]
[Solm]             [Rem]
Él la llamó para alabanza de Su Nombre
[La7]                  [Rem]
Para que todos conozcan Su poder
[Rem]  [La7]  [Rem]`
  },
  "Cuan grande es Dios": {
    key: "Sol",
    lyrics: `[Intro]
[Sol]  [Mim7]  [Do2]  [Re]

[Estrofa 1]
El [Sol]rey de majestad, vestido en [Mim7]majestad
La tierra gozo tendrá, la [Do2]tierra gozo tendrá
El se [Sol]cubre con la luz, huye la [Mim7]oscuridad
Al escuchar Su voz, al [Do2]escuchar Su voz

[Coro]
Cuan [Sol]grande es Dios, cántale
Cuan [Mim7]grande es Dios, y todos lo verán
Cuan [Do2]grande, cuan [Re]grande es [Sol]Dios

[Estrofa 2]
De [Sol]edad en edad El es, el tiempo [Mim7]en Sus manos está
Principio y el fin, prin[Do2]cipio y el fin
La [Sol]Trinidad en Dios, Padre [Mim7]Hijo y Espíritu
Cordero y el León, Cor[Do2]dero y el León

[Puente]
Tu [Sol]Nombre sobre todo es
Tu [Mim7]eres digno de alabar
Y mi [Do2]ser cantará, cuan [Re]grande es [Sol]Dios`
  },
  "10.000 Razones": {
    key: "Sol",
    lyrics: `[Coro]
Que [Do]todo lo que [Sol]soy alabe al [Re]Señor, [Mim]con todo mi [Do]corazón
[Sol]De Su grande a[Re]mor cantaré, [Do]alaba [Mim]al Señor
[Do]Alaba a [Re]Dios, [Sol]oh alma mía

[Estrofa 1]
Sale el [Do]sol, es un [Sol]nuevo amanecer
[Re]Cantaré a [Mim]Ti otra vez
[Do]Sea lo que [Sol]venga y lo que [Re]esté por de[Mim]lante
[Do]Cantaré al [Sol]llegar el a[Re]tarde[Sol]cer`
  },
  "Al estar aquí": {
    key: "La",
    lyrics: `[Estrofa]
[La]Al estar en la pre[Do#m]sencia de Tu divinidad
[Re]Y al contemplar la her[Sim]mosura de Tu santi[Mi]dad
[La]Mi espíritu se a[Do#m]legra en Tu majestad
[Re]Te adoro a Ti, [Sim]Te adoro a [Mi]Ti

[Coro]
[La]Porque Tu eres [Do#m]Santo, Dios
[Re]Te adoro a Ti, [Sim]Te adoro a [Mi]Ti
[La]Porque Tu eres [Do#m]Santo, Dios
[Re]Te adoro a Ti, [Sim]Te adoro a [Mi]Ti`
  },
  "A quien iré": {
    key: "Sol",
    lyrics: `[Estrofa]
[Sol]¿A quién iré en [Re/Fa#]necesidad?
[Mim]¿A quién iré en [Sim]busca de paz?
[Do]¿Y quién podrá mi [Sol]alma saciar de [Lam7]gozo? [Re]

[Coro]
[Sol]Jesús, Tú [Re]eres mi refugio
[Mim]Jesús, Tú [Sim]eres mi sustento
[Do]En Ti con[Sol]fiaré, [Lam7]mi Dios de [Re]amor`
  }
};

export const INITIAL_FULL_SONG_CATALOG: SongItem[] = OFFICIAL_SONG_LIST.map((item, index) => {
  const sample = SAMPLE_LYRICS_MAP[item.title];
  return {
    id: `cat_song_${index + 1}`,
    title: item.title,
    artist: item.artist,
    key: sample ? sample.key : '',
    lyrics: sample ? sample.lyrics : undefined,
  };
});
