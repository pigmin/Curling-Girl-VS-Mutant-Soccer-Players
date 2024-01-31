import { KeyboardEventTypes } from "@babylonjs/core";
import { GlobalManager } from "./globalmanager";

class InputController {

    inputMap = {};
    actions = {};

    static get instance() {
        return (globalThis[Symbol.for(`PF_${InputController.name}`)] ||= new this());
    }

    constructor() {

    }

    init() {
        GlobalManager.scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case KeyboardEventTypes.KEYDOWN:
                    this.inputMap[kbInfo.event.code] = true;
                    console.log(`KEY DOWN: ${kbInfo.event.code} / ${kbInfo.event.key}`);
                    break;
                case KeyboardEventTypes.KEYUP:
                    this.inputMap[kbInfo.event.code] = false;
                    this.actions[kbInfo.event.code] = true;
                    console.log(`KEY UP: ${kbInfo.event.code} / ${kbInfo.event.key}`);
                    break;
            }
        });

    }

    update() {

    }

    resetActions() {
        this.actions = {};
    }

    
}

//Destructuring on ne prends que la propriété statique instance
const {instance} = InputController;
export { instance as InputController };
