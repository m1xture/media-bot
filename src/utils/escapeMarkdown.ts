const escapeMarkdown = (text: string) =>
  text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, "\\$&");
export default escapeMarkdown;
