import { test, mock } from "node:test";
import assert from "node:assert/strict";
import {
  bookFromSources,
  cleanChapterTitle,
  cleanDescription,
  getBookDetail,
  pickChapters,
  pickPages,
  pickPublisher,
  pickTitle,
  pickWorks,
  type BookSources,
} from "../src/book/detail";
import { bookContent, bookStartFormat } from "../src/book/content";
import { searchBooks, type OpenLibraryEdition } from "../src/book/openlibrary";
import { buildBookQuery, type BookWikidataRow } from "../src/book/wikidata";
import {
  buildPosterSpec,
  type EditableContent,
  emptyLists,
  listingTextInfo,
  localizePosterSpec,
  newListRow,
  POSTER_FORM_DEFAULTS,
  posterTextInfo,
  textSourceCredit,
} from "@freetsy/poster";
import { defaultCreditLabels } from "@freetsy/renderer";
import i18n from "@freetsy/i18n";

function edition(overrides: Partial<OpenLibraryEdition> = {}): OpenLibraryEdition {
  return { title: "", languages: [], pages: 0, publishers: [], contents: [], ...overrides };
}

function wd(kind: string, value: string, extra = "", links = ""): BookWikidataRow {
  return { kind, value, extra, links };
}

const toc = (names: string[], level = 0) =>
  names.map((name, index) => ({ level, label: "", title: name, page: String(index * 10 + 1) }));

void test("a chapter keeps its own name, not the number some editions print before it", () => {
  assert.equal(cleanChapterTitle("1. Le survivant"), "Le survivant");
  assert.equal(cleanChapterTitle("Chapter 3: The Letters"), "The Letters");
  assert.equal(cleanChapterTitle("Kapitel IV – Rätsel im Dunkeln"), "Rätsel im Dunkeln");
  assert.equal(cleanChapterTitle("  The   boy who lived "), "The boy who lived");
  assert.equal(cleanChapterTitle("1984"), "1984");
});

void test("chapters come from the reader's edition first, top level only", () => {
  const editions = [
    edition({ languages: ["fre"], contents: toc(["Un", "Deux"]) }),
    edition({ languages: ["eng"], contents: toc(["One", "Two", "Three"]) }),
    edition({
      languages: ["ger"],
      contents: [
        { level: 1, label: "", title: "1. Ein unerwartetes Fest", page: "13" },
        { level: 2, label: "", title: "Ein Abschnitt", page: "20" },
        { level: 1, label: "", title: "2. Hammelbraten", page: "47" },
      ],
    }),
    edition({ languages: ["ger"], contents: [] }),
  ];
  assert.deepEqual(pickChapters(editions, "de"), [
    { name: "Ein unerwartetes Fest", detail: "13" },
    { name: "Hammelbraten", detail: "47" },
  ]);
  assert.deepEqual(
    pickChapters(editions.slice(0, 2), "de").map((chapter) => chapter.name),
    ["One", "Two", "Three"],
  );
  assert.deepEqual(pickChapters([edition({ languages: ["ger"] })], "de"), []);
});

void test("title, publisher and pages follow the reader's own editions", () => {
  const work = {
    title: "The Hobbit",
    description: "",
    firstSentence: "",
    people: [],
    places: [],
    times: [],
    subjects: [],
    authorKey: "",
  };
  const editions = [
    edition({ title: "The Hobbit", languages: ["eng"], publishers: ["Allen & Unwin"], pages: 310 }),
    edition({ title: "Der Hobbit", languages: ["ger"], publishers: ["Klett-Cotta"], pages: 331 }),
    edition({ title: "Der Hobbit", languages: ["ger"], publishers: ["Klett-Cotta"], pages: 380 }),
    edition({
      title: "Der kleine Hobbit",
      languages: ["ger"],
      publishers: ["Independently Published"],
      pages: 320,
    }),
  ];
  assert.equal(pickTitle(work, editions, "", "de"), "Der Hobbit");
  assert.equal(
    pickTitle(work, editions, "Der Hobbit oder Hin und zurück", "de"),
    "Der Hobbit oder Hin und zurück",
  );
  assert.equal(pickTitle(work, [], "", "de"), "The Hobbit");
  assert.equal(pickPublisher(editions, "de"), "Klett-Cotta");
  assert.equal(pickPublisher(editions, "en"), "Allen & Unwin");
  assert.equal(pickPublisher([edition({ publishers: ["CreateSpace"] })], "de"), "");
  assert.equal(pickPages(editions, "de", 0), 331);
  assert.equal(pickPages([], "de", 302), 302);
});

void test("other works list the author's books oldest first, never this one or its series", () => {
  const self = {
    id: "OL82563W",
    titles: ["Harry Potter und der Stein der Weisen", "Harry Potter"],
  };
  assert.deepEqual(
    pickWorks(
      [
        wd("work", "Harry Potter", "1997"),
        wd("work", "Harry Potter und der Stein der Weisen", "1997"),
        wd("work", "Harry Potter und der Feuerkelch", "2000"),
        wd("work", "Harry Potter und der Feuerkelch", "2001"),
        wd("work", "Harry Potter und die Kammer des Schreckens", "1998"),
      ],
      [],
      self,
    ),
    [
      { name: "Harry Potter und die Kammer des Schreckens", detail: "1998" },
      { name: "Harry Potter und der Feuerkelch", detail: "2000" },
    ],
  );
  assert.deepEqual(
    pickWorks(
      [wd("work", "Nur eins", "2000")],
      [
        { id: "OL82563W", name: "Harry Potter and the Philosopher's Stone", detail: "1997" },
        { id: "OL2", name: "The Casual Vacancy", detail: "2012" },
        { id: "OL3", name: "the casual vacancy.", detail: "2013" },
        { id: "OL4", name: "Harry Potter and the Chamber of Secrets", detail: "1998" },
      ],
      self,
    ),
    [
      { name: "Harry Potter and the Chamber of Secrets", detail: "1998" },
      { name: "The Casual Vacancy", detail: "2012" },
    ],
  );
});

void test("an Open Library description keeps its text and drops its Markdown", () => {
  assert.deepEqual(
    cleanDescription(
      "A **great** [story](https://example.com) ([source][1])\r\n\r\n----------\r\nSecond line.\r\n[1]: https://example.com",
    ),
    ["A great story", "Second line."],
  );
});

function sources(overrides: Partial<BookSources> = {}): BookSources {
  return {
    id: "OL82563W",
    language: "de",
    work: {
      title: "Harry Potter and the Philosopher's Stone",
      description: "Harry has never heard of Hogwarts.",
      firstSentence: "Mr. and Mrs. Dursley were proud to say …",
      people: ["Harry Potter", "Ron Weasley"],
      places: ["England"],
      times: ["Late 1990s"],
      subjects: ["Fiction", "Magic", "series:Harry_Potter", "Juvenile fiction", "Wizards"],
      authorKey: "OL23919A",
    },
    summary: {
      authors: ["J. K. Rowling"],
      authorKey: "OL23919A",
      firstYear: "1997",
      medianPages: 302,
    },
    editions: [],
    wikidata: [],
    authorWorks: [],
    ...overrides,
  };
}

void test("a book takes Wikidata's names where it has them, Open Library's otherwise", () => {
  const bare = bookFromSources(sources());
  assert.equal(bare.title, "Harry Potter and the Philosopher's Stone");
  assert.equal(bare.releaseDate, "1997");
  assert.equal(bare.pageCount, 302);
  assert.deepEqual(bare.characters, [
    { name: "Harry Potter", detail: "" },
    { name: "Ron Weasley", detail: "" },
  ]);
  assert.equal(bare.firstSentence, "Mr. and Mrs. Dursley were proud to say …");
  assert.equal(bare.sourceUrl, "https://openlibrary.org/works/OL82563W");
  assert.deepEqual(
    bare.credits.map((credit) => [credit.key, credit.values]),
    [
      ["author", ["J. K. Rowling"]],
      ["genre", ["Magic", "Wizards"]],
      ["places", ["England"]],
      ["era", ["Late 1990s"]],
    ],
  );

  const enriched = bookFromSources(
    sources({
      wikidata: [
        wd("label", "Harry Potter und der Stein der Weisen"),
        wd("date", "1997-06-26T00:00:00Z", "11"),
        wd("character", "Hermine Granger", "", "82"),
        wd("character", "Harry Potter", "", "90"),
        wd("genre", "Fantasy", "", "101"),
        wd("genre", "young adult fiction", "", "0"),
        wd("form", "Roman", "", "184"),
        wd("series", "Harry Potter", "1"),
        wd("firstLine", "Mr and Mrs Dursley, of number four, Privet Drive …"),
        wd("article", "Harry Potter und der Stein der Weisen", "https://de.wikipedia.org/"),
      ],
    }),
  );
  assert.equal(enriched.title, "Harry Potter und der Stein der Weisen");
  assert.equal(enriched.releaseDate, "1997-06-26");
  assert.equal(enriched.releaseDatePrecision, "day");
  assert.deepEqual(
    enriched.characters.map((character) => character.name),
    ["Harry Potter", "Hermine Granger"],
  );
  assert.deepEqual(enriched.series, { name: "Harry Potter", position: "1" });
  assert.equal(enriched.firstSentence, "Mr and Mrs Dursley, of number four, Privet Drive …");
  assert.equal(
    enriched.sourceUrl,
    "https://de.wikipedia.org/wiki/Harry_Potter_und_der_Stein_der_Weisen",
  );
  assert.deepEqual(enriched.credits.find((credit) => credit.key === "genre")?.values, ["Fantasy"]);
  assert.deepEqual(
    enriched.credits.map((credit) => credit.key),
    ["author", "series", "genre", "form", "places", "era"],
  );
});

void test("a picked book fills the form and opens on what it has to say", () => {
  const book = {
    ...bookFromSources(
      sources({
        wikidata: [wd("series", "Harry Potter", "1"), wd("genre", "Fantasy", "", "10")],
        editions: [
          edition({
            languages: ["ger"],
            contents: toc(["Ein Junge überlebt", "Ein Fenster verschwindet"]),
          }),
        ],
      }),
    ),
    summary: "Harry erfährt, dass er ein Zauberer ist.",
    summarySource: null,
  };
  const fields = bookContent(
    book,
    (key) => `label:${key}`,
    (series) => `${series.name} · Band ${series.position}`,
  );
  assert.equal(fields.subtitle, "J. K. Rowling");
  assert.equal(fields.pages, "302");
  assert.equal(fields.quote, "Mr. and Mrs. Dursley were proud to say …");
  assert.deepEqual(
    fields.credits.map((credit) => [credit.label, credit.value]),
    [
      ["label:series", "Harry Potter · Band 1"],
      ["label:genre", "Fantasy"],
    ],
  );
  assert.deepEqual(
    fields.creditOptions.map((credit) => credit.label),
    ["label:author", "label:series", "label:genre", "label:places", "label:era"],
  );
  assert.equal(bookStartFormat(fields), "chapters");
  assert.equal(bookStartFormat({ ...fields, chapters: [] }), "characters");
  assert.equal(bookStartFormat({ ...fields, chapters: [], characters: [] }), "freeform");
});

const bookContentBase: EditableContent = {
  ...POSTER_FORM_DEFAULTS.content,
  title: "Der Hobbit",
  subtitle: "J. R. R. Tolkien",
  releaseDate: "1937-09-21",
  pages: "331",
  format: "chapters",
  lists: {
    ...emptyLists(),
    chapters: Array.from({ length: 12 }, (_, index) =>
      newListRow({ name: `Kapitel ${index + 1}`, detail: String(index * 20 + 13) }),
    ),
  },
};

void test("a book poster numbers its chapters, prints its pages and no soundwave credit", () => {
  const info = listingTextInfo(bookContentBase, "book");
  assert.equal(info.kind, "book");
  assert.equal(info.numbered, true);
  assert.equal(info.pageCount, 331);
  assert.equal(info.totalDurationMs, 0);
  const rows = info.columns.flat();
  assert.deepEqual([rows[0].numberLabel, rows[0].durationLabel], ["01", "13"]);
  assert.equal(rows[11].numberLabel, "12");
  assert.equal(info.columns.length, 2);
  assert.deepEqual(
    listingTextInfo(bookContentBase, "book", false)
      .columns.flat()
      .map((row) => row.durationLabel)
      .filter(Boolean),
    [],
  );
  assert.equal(
    listingTextInfo({ ...bookContentBase, format: "characters" }, "book").numbered,
    false,
  );

  const t = i18n.t.bind(i18n);
  const localized = localizePosterSpec(buildPosterSpec(info, "", []), "de", t);
  assert.equal(localized.totalLengthLabel, "331 Seiten");
  assert.deepEqual(defaultCreditLabels("book", t), { released: "Erschienen", length: "Umfang" });
});

void test("the book query finds the work by its Open Library id", () => {
  const query = buildBookQuery("OL82563W", "de");
  assert.ok(query.includes('?book wdt:P648 "OL82563W"'));
  assert.ok(query.includes("wdt:P674"));
  assert.ok(query.includes("wdt:P1922"));
  assert.ok(query.includes('wikibase:language "de,mul,en"'));
});

void test("searching reads Open Library's hits as they are ranked", async () => {
  let requested: URL | undefined;
  const fetchMock = mock.method(globalThis, "fetch", (url: URL) => {
    requested = url;
    return Promise.resolve(
      Response.json({
        docs: [
          {
            key: "/works/OL27482W",
            title: "The Hobbit",
            author_name: ["J.R.R. Tolkien"],
            first_publish_year: 1937,
            edition_count: 482,
          },
          { key: "/works/OL1W", title: "Untitled" },
        ],
      }),
    );
  });
  try {
    assert.deepEqual((await searchBooks("hobbit"))._unsafeUnwrap(), [
      {
        id: "OL27482W",
        title: "The Hobbit",
        authors: "J.R.R. Tolkien",
        year: "1937",
        editionCount: 482,
      },
      { id: "OL1W", title: "Untitled", authors: "", year: "", editionCount: 0 },
    ]);
    assert.equal(
      `${requested?.origin}${requested?.pathname}`,
      "https://openlibrary.org/search.json",
    );
    assert.equal(requested?.searchParams.get("q"), "hobbit");
    assert.equal((await searchBooks("  "))._unsafeUnwrap().length, 0);
  } finally {
    fetchMock.mock.restore();
  }
});

void test("a book loads from its work alone when every other source is down", async () => {
  let workUp = true;
  const fetchMock = mock.method(globalThis, "fetch", (url: URL) => {
    if (url.pathname === "/works/OL27482W.json") {
      return Promise.resolve(
        workUp
          ? Response.json({
              title: "The Hobbit",
              description: { type: "/type/text", value: "Bilbo goes on an adventure." },
              subject_people: ["Bilbo Baggins", "Gandalf"],
            })
          : new Response("down", { status: 503 }),
      );
    }
    return Promise.resolve(new Response("busy", { status: 429 }));
  });
  try {
    const book = (await getBookDetail("OL27482W", "de"))._unsafeUnwrap();
    assert.equal(book.title, "The Hobbit");
    assert.deepEqual(
      book.characters.map((character) => character.name),
      ["Bilbo Baggins", "Gandalf"],
    );
    assert.equal(book.summary, "Bilbo goes on an adventure.");
    assert.deepEqual(book.summarySource, {
      kind: "openlibrary",
      url: "https://openlibrary.org/works/OL27482W",
      shortened: false,
    });
    assert.deepEqual(book.chapters, []);

    workUp = false;
    assert.equal((await getBookDetail("OL27482W", "de")).isErr(), true);
    assert.equal((await getBookDetail("OL1; DROP", "de")).isErr(), true);
  } finally {
    fetchMock.mock.restore();
  }
});

void test("a summary names its source on the poster, in the license's words, while it prints", () => {
  const words = {
    wikipedia: (title: string) => `Wikipedia, „${title}“`,
    openLibrary: "Open Library, Beschreibung",
    shortened: "gekürzt",
    license: "CC BY-SA 4.0",
  };
  assert.equal(
    textSourceCredit({ kind: "wikipedia", title: "Der Hobbit", url: "", shortened: true }, words),
    "Wikipedia, „Der Hobbit“, gekürzt · CC BY-SA 4.0",
  );
  assert.equal(
    textSourceCredit({ kind: "openlibrary", url: "", shortened: false }, words),
    "Open Library, Beschreibung",
  );
  assert.equal(textSourceCredit(null, words), "");

  const content: EditableContent = {
    ...bookContentBase,
    format: "freeform",
    freeformText: "Bilbo zieht aus.",
    textSource: "Wikipedia, „Der Hobbit“, gekürzt · CC BY-SA 4.0",
  };
  const display = {
    showSubtitle: true,
    showListDetails: true,
    showTextSource: true,
    textSourceLabel: "Text",
  };
  assert.deepEqual(posterTextInfo(content, "book", display).extraCredits, [
    { label: "Text", value: "Wikipedia, „Der Hobbit“, gekürzt · CC BY-SA 4.0" },
  ]);
  assert.deepEqual(
    posterTextInfo({ ...content, format: "chapters" }, "book", display).extraCredits,
    [],
  );
  assert.deepEqual(
    posterTextInfo(content, "book", { ...display, showTextSource: false }).extraCredits,
    [],
  );
});
