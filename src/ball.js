import { PhysicsAggregate, PhysicsShapeType, Scene, SceneLoader, Vector3 } from "@babylonjs/core";

import ballModelUrl from "../assets/models/ball.glb";
import { GlobalManager } from "./globalmanager";

class Ball {

    x;
    y;
    z;

    gameObject;
    meshAggregate;

    constructor(x, y, z) {
        this.x = x || 0;
        this.y = y || 0;
        this.z = z || 0;
    }

    async init() {
        const result = await SceneLoader.ImportMeshAsync("", "", ballModelUrl, GlobalManager.scene);
        this.gameObject = result.meshes[1];
        this.gameObject.parent = null;
        result.meshes[0].dispose();

        this.gameObject.scaling.scaleInPlace(1.5);
        this.gameObject.position = new Vector3(this.x, this.y, this.z);
        this.meshAggregate = new PhysicsAggregate(this.gameObject, PhysicsShapeType.SPHERE, { mass: .05, friction: 0.2, restitution: 0.8 });
    }

    update(delta) {

    }

    resetToCenter() {
        this.meshAggregate.body.disablePreStep = false;
        // The position where you want to move the body to
        this.meshAggregate.body.transformNode.position.set(this.x, this.y, this.z);
        this.meshAggregate.body.setLinearVelocity(Vector3.Zero());
        GlobalManager.scene.onAfterRenderObservable.addOnce(() => {
            // Turn disablePreStep on again for maximum performance
            this.meshAggregate.body.disablePreStep = true;
        });
    }
}

export default Ball;