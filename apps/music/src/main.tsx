import { mountWorkshop } from "@freetsy/workshop";
import "@freetsy/styles";
import { PosterCreator } from "./components/music-poster-creator";

mountWorkshop({ id: "music", Home: PosterCreator });
