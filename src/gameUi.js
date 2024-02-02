import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { GlobalManager } from "./globalmanager";

class GameUI {

    constructor() {
        this.getCanvasSize();
    }

    async init() {
      this.loadUI();
    }

    update() {

    }

    loadUI() {
        this.textScale = 1;
        let fontSize = 22 * this.textScale;
        let spacing = 150 * this.textScale;
    
        this.screenUI = AdvancedDynamicTexture.CreateFullscreenUI("gameUI");
    
        //ScoreA
        this.textScoreA = new TextBlock();
        this.textScoreA.color = "white";
        this.textScoreA.fontSize = fontSize;
        this.textScoreA.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this.textScoreA.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.textScoreA.left = -spacing * 3;
        this.textScoreA.top = 20;
        this.screenUI.addControl(this.textScoreA);
    
        // ScoreB
        this.textScoreB = new TextBlock();
        this.textScoreB.color = "white";
        this.textScoreB.fontSize = fontSize;
        this.textScoreB.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this.textScoreB.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.textScoreB.right = -spacing * 3;
        this.textScoreB.top = 20;
        this.screenUI.addControl(this.textScoreB);
    
        // High score
        this.textHigh = new TextBlock();
        this.textHigh.color = "white";
        this.textHigh.fontSize = fontSize;
        this.textHigh.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this.textHigh.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER
        this.textHigh.left = spacing * 3;
        this.textHigh.top = 20;
        this.screenUI.addControl(this.textHigh);
    
        // Lives
        this.textLives = new TextBlock("Score");
        this.textLives.color = "white";
        this.textLives.fontSize = fontSize;
    
        this.textLives.fontFamily = 'Courier New';
        this.textLives.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this.textLives.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.textLives.left = spacing;
        this.textLives.top = 20;
        this.screenUI.addControl(this.textLives);
        this.show(false);
    
        this.updateAllText();
        window.onresize = () => {
          this.getCanvasSize();
          this.fixTextScale();
        }
      }
      show(bActive) {
        this.screenUI.rootContainer.isVisible = bActive;
      }
      updateAllText() {
        this.updateTextLives();
        this.updateTextScoreA();
        this.updateTextScoreB();
        this.updateTextHighScore();
        this.updateTextLevel();
      }
      updateTextLives() {
        //this.textLives.text = `Lifes : ${nbLives}`;
      }
      updateTextScoreA() {
        this.textScoreA.text = `Score A : ${GlobalManager.scoreA}`;
      }
      updateTextScoreB() {
        this.textScoreB.text = `Score B : ${GlobalManager.scoreB}`;
      }
      updateTextHighScore() {
        //this.textHigh.text = `HighScore : ${currentHighScore}`;
      }
    
      updateTextLevel() {
        //this.textLevel.text = `Level : ${currentLevel}`;
      }
    
    
      getCanvasSize() {
        GlobalManager.canvasWidth = document.querySelector("canvas").width;
        GlobalManager.canvasHeight = document.querySelector("canvas").height;
      }
    
      fixTextScale() {

      }
}

export default GameUI;