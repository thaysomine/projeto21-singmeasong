import { prisma } from "../../../src/database.js";
import { recommendationFactory } from "../factories/recommendationFactory.js";

export async function deleteAllRecommendations() {
    await prisma.$transaction([
        prisma.$executeRaw`TRUNCATE TABLE recommendations RESTART IDENTITY`
    ])
}

export async function createRecommendation(length =1, score = 0) {
    const recommendations = await Promise.all(
        Array.from({ length }, () => recommendationFactory(score)).map(
            async recommendation => await prisma.recommendation.create({ data: recommendation }) 
        )
    );
    console.log(recommendations);
    return recommendations;
}