import { faker } from "@faker-js/faker";

export const recommendationFactory = (score = 0) => {
    return {
        name: faker.music.songName(),
        youtubeLink: "https://www.youtube.com/watch?v=EG9t7Wsc9YU",
        ...(score && { score }),
    }
}