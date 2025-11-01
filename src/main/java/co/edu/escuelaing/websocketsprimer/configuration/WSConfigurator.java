package co.edu.escuelaing.websocketsprimer.configuration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.socket.server.standard.ServerEndpointExporter;
@Configuration
@EnableScheduling
public class WSConfigurator {
 @Bean
 public ServerEndpointExporter serverEndpointExporter() {
 return new ServerEndpointExporter();
 }
}
