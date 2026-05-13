class IntlMessageFormat {
  constructor(message, _locale, _formats, _opts) {
    this.message = message;
  }
  format(values) {
    if (typeof this.message !== "string") return String(this.message);
    return this.message.replace(/\{(\w+)(?:,[^}]*)?\}/g, (match, key) => {
      if (values && key in values) return String(values[key]);
      return match;
    });
  }
}

module.exports = {
  __esModule: true,
  default: IntlMessageFormat,
  IntlMessageFormat,
};
