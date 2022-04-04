import { readFile } from "fs/promises";
import { relative, dirname, basename, extname } from "path";
import { marked } from "marked";
import {
  // info
  blue,
  // error
  red,
  // warn
  yellow
} from "chalk";

import { REPO_DIR } from "../common";

import { Handler } from "./handler";
import {
  EndpointEngine,
  ExampleEngine,
  StructureEngine,
  ConstantEngine
} from "./engines";
import { firstSplit } from "./util";

console.info = (...args) => console.log(blue(...args));
console.error = (...args) => console.log(red(...args));
console.warn = (...args) => console.log(yellow(...args));

export async function parse(filePath: string) {
  const href = [
    dirname(relative(REPO_DIR, filePath)),
    basename(filePath, extname(filePath))
  ]
    .join("_")
    .toUpperCase();

  const handlers = [
    new Handler(EndpointEngine),
    new Handler(ExampleEngine),
    new Handler(StructureEngine),
    new Handler(ConstantEngine)
  ];

  const content = await readFile(filePath, "utf8");
  const blocks = marked.lexer(content);

  let parent: string = "";
  let tree: string[] = [];

  for (const block of blocks) {
    try {
      for (const handler of handlers) handler.process(block, tree, handlers);
    } catch (err) {
      if (err !== "blocked") console.error(err);
      else for (const handler of handlers) handler.handleBlocked();
    }

    if (block.type === "heading") {
      // https://github.com/discord/discord-api-docs/issues/4708#issuecomment-1079834021
      const anchor =
        href +
        firstSplit(block.text, "%")[0]
          .replace(/[.,/#!$%^&*;:{}=\-_—–`'~()?]/g, "") // remove punctuation
          .replace(/\s+/g, "-") // turn spaces into dashes
          .toLowerCase();

      if (block.depth < 5) {
        parent = anchor + "-";
        tree.push(anchor);
      } else tree.push(parent + anchor);
    }
  }

  for (const handler of handlers) handler.flush(tree, handlers);

  const [endpoints, examples, structures, constants] = handlers;
  return { endpoints, examples, structures, constants };
}