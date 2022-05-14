export const serializable = (o: any): boolean =>
    typeof o === "undefined"
        ? false
        : typeof o === "object"
        ? o
            ? Object.keys(o).every((k) => serializable(o[k]))
            : true
        : ["string", "number", "boolean"].includes(typeof o);

export const serialize = (o: any): string => JSON.stringify(o);

export const deserialize = <T = unknown>(s: string): T => JSON.parse(s);

export const normalize = (o: any): string =>
    typeof o === "undefined" || o === null
        ? "null"
        : JSON.stringify(
              Object.fromEntries(
                  Object.entries(JSON.parse(JSON.stringify(o)))
                      .sort(([a], [b]) => (a < b ? 1 : -1))
                      .map(([k, v]) => [k, typeof v === "object" && v ? JSON.parse(normalize(v)) : v])
              )
          );

export const clone = (o: any) => (typeof o === "undefined" ? null : JSON.parse(JSON.stringify(o)));
