import { CatalogWorkshop, mountWorkshop } from "@freetsy/workshop";
import "@freetsy/styles";
import { filmWorkshop } from "./film-workshop";

mountWorkshop({ id: "film", Home: () => <CatalogWorkshop workshop={filmWorkshop} /> });
