FROM openjdk:11-jre-slim

WORKDIR /opt

COPY build/libs/*-all.jar ./app.jar

CMD ["/bin/sh", "-c", "java -jar app.jar"]