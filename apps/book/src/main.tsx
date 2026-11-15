import { CatalogWorkshop, mountWorkshop } from "@freetsy/workshop";
import "@freetsy/styles";
import { bookWorkshop } from "./book-workshop";

mountWorkshop({ id: "book", Home: () => <CatalogWorkshop workshop={bookWorkshop} /> });
