import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AssetEntityNotFoundException } from "../../common/exceptions/asset-entity-not-found.exception";
import { CreatePositionRequestDto } from "./dto/req/create-position-request.dto";
import { CreatePositionResponseDto } from "./dto/res/create-position-response.dto";

@Injectable()
export class PositionsService {
  private readonly logger = new Logger(PositionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createPositions(userId: string, body: CreatePositionRequestDto[]): Promise<CreatePositionResponseDto[]> {
    this.logger.log(`📥 [Position Engine] 유저 ${userId} - 보유 종목 일괄 등록 시도`);

    if (body.length === 0) {
      throw new BadRequestException("등록할 매수 내역이 없습니다.");
    }

    const groupedByStockId = body.reduce(
      (acc, item) => {
        if (!acc[item.stockId]) {
          acc[item.stockId] = [];
        }

        acc[item.stockId].push(item);
        return acc;
      },
      {} as Record<number, CreatePositionRequestDto[]>,
    );

    return this.prisma.$transaction(async (tx) => {
      const results: CreatePositionResponseDto[] = [];

      for (const [stockIdText, purchases] of Object.entries(groupedByStockId)) {
        const stockId = Number(stockIdText);

        const stock = await tx.stock.findUnique({
          where: { id: stockId },
        });

        if (!stock) {
          throw new AssetEntityNotFoundException(stockId);
        }

        if (stock.code === "GLOBAL") {
          throw new BadRequestException("GLOBAL_CHAT은 내 종목으로 등록할 수 없습니다.");
        }

        const existingPosition = await tx.position.findUnique({
          where: {
            userId_stockId: {
              userId,
              stockId,
            },
          },
        });

        if (existingPosition) {
          throw new ConflictException(`이미 내 종목에 등록된 종목입니다. stockId: ${stockId}`);
        }

        const totalInvestedAmount = purchases.reduce(
          (sum, purchase) => sum + purchase.purchasePrice * purchase.purchaseQuantity,
          0,
        );

        const quantity = purchases.reduce((sum, purchase) => sum + purchase.purchaseQuantity, 0);
        const averagePrice = Math.round((totalInvestedAmount / quantity) * 100) / 100;

        const position = await tx.position.create({
          data: {
            userId,
            stockId,
            averagePrice,
            quantity,
            totalInvestedAmount,
          },
        });

        results.push({
          positionId: position.id,
          stockId: stock.id,
          stockName: stock.name,
          averagePrice: Number(position.averagePrice),
          quantity: Number(position.quantity),
          totalInvestedAmount: Number(position.totalInvestedAmount),
        });
      }

      return results;
    });
  }
  async getMyPositions(userId: string) {
    const positions = await this.prisma.position.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        stock: true,
      },
    });

    return positions.map((position) => ({
      positionId: position.id,
      stockId: position.stockId,
      stockCode: position.stock.code,
      stockName: position.stock.name,
      averagePrice: Number(position.averagePrice),
      quantity: Number(position.quantity),
      totalInvestedAmount: Number(position.totalInvestedAmount),
      createdAt: position.createdAt,
      updatedAt: position.updatedAt,
    }));
  }

  async deletePosition(userId: string, positionId: number) {
    const position = await this.prisma.position.findFirst({
      where: {
        id: positionId,
        userId,
      },
    });

    if (!position) {
      throw new NotFoundException("삭제할 내 종목을 찾을 수 없습니다.");
    }

    await this.prisma.position.delete({
      where: {
        id: position.id,
      },
    });

    return {
      positionId: position.id,
    };
  }
}
