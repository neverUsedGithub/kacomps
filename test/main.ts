import kaplay from "kaplay";
import { defineComp } from "../src";

const k = kaplay();

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

k.setGravity(400);

k.loadBean();

k.add([
    k.pos(0, 32 * 5), //
    k.rect(k.width(), 32),
    k.color(k.GREEN),
    Entity(true),
]);

k.add([
    k.sprite("bean"), //
    k.pos(20, 20),
    Entity(),
    Patrol(100, 200),
]);
