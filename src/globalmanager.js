
class GlobalManager {

    canvas;
    engine
    scene;
    camera;

    gameState;

    shadowGenerators = [];

    static get instance() {
        return (globalThis[Symbol.for(`PF_${GlobalManager.name}`)] ||= new this());
    }

    constructor() {

    }

    init(canvas, engine) {
        this.canvas = canvas;
        this.engine = engine;
    }

    addShadowGenerator(shad) {
        this.shadowGenerators.push(shad);
    }

    addShadowCaster(object, bChilds) {
        bChilds = bChilds || false;
        for (let shad of this.shadowGenerators) {
            shad.addShadowCaster(object, bChilds)
        }
    }

    
}

//Destructuring on ne prends que la propriété statique instance
const {instance} = GlobalManager;
export { instance as GlobalManager };
