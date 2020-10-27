import { parseFrontmatter } from "../loaders/yaml.js";

export default class TemplateEngine {
  constructor(site, options = {}) {
    this.site = site;
    this.includes = "_includes";
    this.options = options;
  }

  render(content, data) {
    //To implement
  }

  addFilter(name, fn) {
    //To implement
  }

  async load(path) {
    const content = await Deno.readTextFile(path);
    return parseFrontmatter(content);
  }
}
