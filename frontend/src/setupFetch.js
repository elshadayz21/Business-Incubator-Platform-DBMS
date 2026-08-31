import { apiUrl } from "./config/api.js";

const nativeFetch = window.fetch.bind(window);

window.fetch = (input, init) => {
  if (typeof input === "string" && input.startsWith("/")) {
    return nativeFetch(apiUrl(input), init);
  }
  return nativeFetch(input, init);
};
