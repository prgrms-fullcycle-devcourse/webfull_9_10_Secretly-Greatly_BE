import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle("Secretly-Greatly API")
    .setDescription("Secretly-Greatly 백엔드 API 문서")
    .setVersion("1.0.0")
    .addCookieAuth("accessToken")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api-docs", app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`Server running on http://localhost:${port}`);
  console.log(`Swagger docs: http://localhost:${port}/api-docs`);
}

void bootstrap();
