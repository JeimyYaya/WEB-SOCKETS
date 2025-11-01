# Escuela Colombiana de Ingeniería  
## Laboratorio – Spring Boot, WebSockets y ReactJS  

**Autor:** Jeimy Yaya  

---

## Descripción General

Este laboratorio implementa una aplicación web con comunicación bidireccional entre un servidor **Spring Boot** y un cliente **ReactJS** usando **WebSockets**.  
El servidor envía (hace broadcast) un mensaje con la hora actual cada 5 segundos a todos los clientes conectados.

### Objetivos

- Configurar un servidor web con **Spring Boot**.  
- Exponer un **endpoint WebSocket**.  
- Enviar mensajes periódicos a los clientes.  
- Consumir esos mensajes en el cliente usando **ReactJS**.

---

## Arquitectura del Proyecto
```
Servidor (Spring Boot)
│
├── Controladores REST (WebController)
├── Endpoint WebSocket (TimerEndpoint)
├── Emisor de mensajes programados (TimedMessageBroker)
└── Configuración del contenedor IoC (WSConfigurator)
│
└── Cliente (ReactJS + HTML)
    ├── index.html
    └── js/WsComponent.jsx
```
---

## Conceptos Clave

### Spring Boot

Framework que simplifica el desarrollo de aplicaciones empresariales Java mediante inyección de dependencias (IoC), anotaciones y componentes preconfigurados.

**Principales anotaciones usadas:**
- `@SpringBootApplication` → Marca la clase principal que inicia la aplicación.  
- `@RestController` → Define controladores REST para manejar solicitudes HTTP.  
- `@Component`, `@Service`, `@Repository` → Componentes del modelo IoC.  
- `@Scheduled` → Permite ejecutar tareas periódicamente.  
- `@Configuration` y `@Bean` → Definen configuraciones personalizadas.

### WebSockets

Permiten un canal de comunicación bidireccional y persistente entre cliente y servidor, sin necesidad de hacer polling constante.  
El servidor puede enviar datos en tiempo real a todos los clientes conectados.

---

## Estructura del Proyecto
```
src/
├── main/
│   ├── java/co/edu/escuelaing/websocketsprimer/
│   │   ├── WSStartApp.java
│   │   ├── WebController.java
│   │   ├── components/TimedMessageBroker.java
│   │   ├── endpoints/TimerEndpoint.java
│   │   └── configuration/WSConfigurator.java
│   └── resources/
│       └── static/
│           ├── index.html
│           └── js/
│               └── WsComponent.jsx
└── pom.xml
```
## Paso a Paso
1️. Crear el proyecto base con Maven
```
mvn archetype:generate -DarchetypeGroupId=org.apache.maven.archetypes \
-DarchetypeArtifactId=maven-archetype-quickstart -DarchetypeVersion=1.4
```
2️. Actualizar el pom.xml

Agregar la dependencia para Spring Boot Web:
```
<dependencies>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <version>3.2.0</version>
  </dependency>
</dependencies>
```
3️. Crear la clase principal del servidor

`WSStartApp.java`
```java
@SpringBootApplication
public class WSStartApp {
  public static void main(String[] args){
    SpringApplication.run(WSStartApp.class, args);
  }
}
```
4️. Crear el controlador básico de prueba

`WebController.java`
```java
@RestController
public class WebController {
  @GetMapping("/status")
  public String status() {
    return "{\"status\":\"Greetings from Spring Boot "
      + java.time.LocalDate.now() + ", "
      + java.time.LocalTime.now()
      + ". The server is Running!\"}";
  }
}
```

5️. Crear el endpoint WebSocket

`TimerEndpoint.java`
```java
@Component
@ServerEndpoint("/timer")
public class TimerEndpoint {
  static Queue<Session> queue = new ConcurrentLinkedQueue<>();

  public static void send(String msg) {
    for (Session session : queue) {
      try {
        session.getBasicRemote().sendText(msg);
      } catch (IOException e) { e.printStackTrace(); }
    }
  }

  @OnOpen
  public void openConnection(Session session) {
    queue.add(session);
    try {
      session.getBasicRemote().sendText("Connection established.");
    } catch (IOException e) { e.printStackTrace(); }
  }

  @OnClose
  public void closedConnection(Session session) {
    queue.remove(session);
  }

  @OnError
  public void error(Session session, Throwable t) {
    queue.remove(session);
    t.printStackTrace();
  }
}
```
6️. Clase que emite mensajes cada 5 segundos

`TimedMessageBroker.java`
```
@Component
@Scope("singleton")
public class TimedMessageBroker {
  private static final SimpleDateFormat dateFormat = new SimpleDateFormat("HH:mm:ss");

  @Scheduled(fixedRate = 5000)
  public void broadcast() {
    TimerEndpoint.send("The time is now " + dateFormat.format(new Date()));
  }
}
```
7️. Configuración del contenedor IoC

`WSConfigurator.java`
```java
@Configuration
@EnableScheduling
public class WSConfigurator {
  @Bean
  public ServerEndpointExporter serverEndpointExporter() {
    return new ServerEndpointExporter();
  }
}
```
8️. Cliente Web (ReactJS + WebSocket)

`index.html`
```html
<!DOCTYPE html>
<html>
  <head>
    <title>Websockets Testing Client</title>
    <meta charset="UTF-8">
  </head>
  <body>
    <hr/>
    <div id="timer"></div>
    <hr/>

    <!-- React y Babel -->
    <script src="https://unpkg.com/react@16/umd/react.development.js" crossorigin></script>
    <script src="https://unpkg.com/react-dom@16/umd/react-dom.development.js" crossorigin></script>
    <script src="https://unpkg.com/babel-standalone@6/babel.min.js"></script>

    <!-- Componente -->
    <script src="js/WsComponent.jsx" type="text/babel"></script>
  </body>
</html>
```

`WsComponent.jsx`
```
class WSClient extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, isLoaded: false, msg: "" };
  }

  componentDidMount() {
    this.wsocket = new WebSocket("ws://localhost:8080/timer");
    this.wsocket.onmessage = (evt) => this.onMessage(evt);
    this.wsocket.onerror = (evt) => this.onError(evt);
  }

  onMessage(evt) {
    this.setState({ isLoaded: true, msg: evt.data });
  }

  onError(evt) {
    this.setState({ error: evt });
  }

  render() {
    const { error, isLoaded, msg } = this.state;
    if (error) return <div>Error: {error.message}</div>;
    if (!isLoaded) return <div>Loading...</div>;
    return (
      <div>
        <h1>The server status is:</h1>
        <p>{msg}</p>
      </div>
    );
  }
}

ReactDOM.render(<WSClient />, document.getElementById("timer"));
```
## Ejecución

- Compilar y ejecutar el proyecto:
```
mvn spring-boot:run
```
- Abrir en el navegador:

**Servidor activo:** http://localhost:8080/status

**Cliente WebSocket:** http://localhost:8080/index.html

Se verá un mensaje que se actualiza automáticamente cada 5 segundos con la hora actual enviada desde el servidor.

## Conclusión

Este laboratorio demuestra cómo integrar:   
- Spring Boot para el backend.
- WebSockets para comunicación en tiempo real.
- ReactJS para el cliente interactivo.

La comunicación bidireccional permite que el servidor emita eventos en vivo a todos los clientes sin que estos tengan que hacer polling constante, mejorando la eficiencia y la experiencia del usuario.
