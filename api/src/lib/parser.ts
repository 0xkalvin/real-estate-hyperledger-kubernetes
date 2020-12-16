export default class Parser {
  static JSONToString(json: object): string {
    try {
      const string = JSON.stringify(json);

      return string;
    } catch (error) {
      return json.toString();
    }
  }

  static bufferToJSON(buffer: Buffer) {
    const json = JSON.parse(buffer.toString());

    return json;
  }
}
