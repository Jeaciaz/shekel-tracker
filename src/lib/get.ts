type Get<Path, Obj> =
    (Path extends `${infer Head}.${infer Tail}`
        ? Head extends `${KeyOfNN<Obj>}`
            ? Get<Tail, NonNullable<Obj>[Head]> | Extract<Obj, undefined>
            : undefined
        // last
        : Path extends KeyOfNN<Obj>
            ? NonNullable<Obj>[Path] | Extract<Obj, undefined>
            : undefined)

type KeyOfNN<Obj> = NonNullable<Obj> extends infer NNObj extends Record<any, any>
    ? NNObj extends Array<any>
        ? Extract<keyof NNObj, number>
        : NNObj extends ReadonlyArray<any>
        ? Extract<keyof NNObj, `${number}`>
        : keyof NNObj
    : never

type PathsIn<Obj> = NonNullable<Obj> extends infer NNObj extends Record<any, any>
    ? KeyOfNN<Obj> extends infer ActualKey extends Extract<keyof NNObj, string | number>
        ? {
            [Key in ActualKey]: `${Key}.${PathsIn<NNObj[Key]>}` | Key
        }[ActualKey]
        : never
    : never

// implementation is really simple but really dirty type-wise, since typescript is not smart enough to match calculated type vs real one
export const get = <const Path extends PathsIn<Obj>, Obj>(path: Path) => (obj: Obj): Get<Path, Obj> => {
    try {
        return (path as string).split('.').reduce((o, seg) => (o as any)[seg as any] as any, obj) as Get<Path, Obj>;
    } catch {
        return undefined as Get<Path, Obj>;
    }
}
