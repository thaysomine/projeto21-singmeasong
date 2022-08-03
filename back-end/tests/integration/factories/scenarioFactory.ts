import { prisma } from "../../../src/database.js";
import { recommendationFactory } from "./recommendationFactory.js";

export async function createRecommendation(length = 1, score = 0) {
    const recommendations = await Promise.all(
        Array.from({ length }, () => recommendationFactory(score)).map(
            async recommendation => await prisma.recommendation.create({ data: recommendation }) 
        )
    );
    console.log(recommendations[0].name, "recommendations[0]");
    return recommendations;
}