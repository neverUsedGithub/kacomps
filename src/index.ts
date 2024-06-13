import type { Comp, GameObj } from "kaplay";

const COMP_EVENTS = [
    "add", //
    "update",
    "draw",
    "destroy",
    "inspect",
    "drawInspect",
] as const;

type Magic<T> = T;
type Unwrap<T> = Magic<{ [K in keyof T]: T[K] }>;

interface KaComponentBody {
    [property: string]: any;
}

type KaComponent<T extends KaComponentBody = KaComponentBody, U extends any[] = any> = {
    id: string;
    (...args: U): Unwrap<(T extends Record<string, any> ? T : {}) & { id: string }>;
};

interface KaComponentContext {
    self: GameObj;
    require<T extends KaComponent | (() => Comp)>(comp: T): Unwrap<ReturnType<T>>;
    on(event: (typeof COMP_EVENTS)[number], callback: () => void): void;
}

/**
 * Define a new component.
 *
 * @example
 * ```ts
 * const Person = defineComp("person", (_, name: string) => {
 *     return { name };
 * });
 *
 * const Greeter = defineComp("greeter", ({ require }) => {
 *     const person = require(Person);
 *
 *     debug.log(`Hello, ${person.name}!`);
 * });
 *
 * add([ Person("World"), Greeter() ]);
 * ```
 */
export function defineComp<T extends KaComponentBody = {}, U extends any[] = any>(
    id: string,
    callback: (ctx: KaComponentContext, ...args: U) => T | void
): KaComponent<T, U> {
    const fn = (...args: U) => {
        return class {
            public id: string = id;

            constructor(self: GameObj) {
                const ctx: KaComponentContext = {
                    self,
                    require: (comp) => {
                        const compId = "id" in comp ? comp.id : comp.name;

                        if (!self.is(compId))
                            throw new Error(
                                `(component '${id}') cannot find component '${compId}'. Did you forget to add it to your game object's component list, or did you mess up the order of your components?`
                            );

                        return self as any;
                    },
                    on(event, callback) {
                        self.on(event, callback);
                    },
                };

                const obj = callback(ctx, ...args);

                if (obj)
                    for (const name in obj) {
                        const prop = Object.getOwnPropertyDescriptor(obj, name)!;
                        const value = prop.value as unknown;

                        if (COMP_EVENTS.includes(name as any))
                            throw new Error(`(component '${id}') reserved property name '${name}'`);

                        if (typeof value === "function") {
                            Object.defineProperty(this, name, {
                                value: (obj[name] as any).bind(self),
                            });
                        } else {
                            const getSet: PropertyDescriptor = {};

                            if (prop.set) getSet.set = prop.set.bind(self);
                            if (prop.get) getSet.get = prop.get.bind(self);

                            if (prop.value) {
                                getSet.get = () => prop.value;
                                getSet.set = (value) => (prop.value = value);
                            }

                            getSet.configurable = prop.configurable ?? true;
                            getSet.enumerable = prop.enumerable ?? true;

                            Object.defineProperty(this, name, getSet);
                        }
                    }
            }
        };
    };

    fn.id = id;

    return fn as any;
}
