# KaComps

A utility library for making type-safe KAPLAY components.

# Installing

```
npm i @justcoding123/kacomps
```

# Examples

### Basic

```ts
const Person = defineComp("person", (_, name: string) => {
    return { name };
});

const Greeter = defineComp("greeter", ({ require }) => {
    const person = require(Person);
    debug.log(`Hello, ${person.name}!`);
});

add([Person("World"), Greeter()]);
```

### A bit more complex

```ts
const Entity = defineComp("entity", ({ self }, _static?: boolean) => {
    self.use(k.body({ isStatic: _static ?? false }));
    self.use(k.area());
});

const Patrol = defineComp("guard", ({ require, on }, speed: number, patrolArea: number) => {
    require(Entity);
    const body = require(k.body);
    const position = require(k.pos);
    const start = position.pos.clone();
    let direction = 1;

    on("update", () => {
        if (body.isFalling()) return;

        if (direction === 1 && position.pos.x > start.x + patrolArea) direction = -1;
        if (direction === -1 && position.pos.x < start.x) direction = 1;

        position.pos.x += speed * direction * k.dt();
    });
});
```
