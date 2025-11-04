import * as tf from '@tensorflow/tfjs';

// NOTE: The WebGL backend import and setBackend call have been removed from this file.

export interface Detection {
  label: string;
  confidence: number;
}
// ... (rest of the interface and constants are the same)
const MODEL_URL = '/model/model.json';
const LABELS_URL = '/model/labels.json';
const CONFIDENCE_THRESHOLD = 0.5;

type ModelStatus = 'unloaded' | 'loading' | 'loaded' | 'failed';

class YoloService {
  // ... (properties are the same)
  private model: tf.GraphModel | null = null;
  private labels: string[] = [];
  public status: ModelStatus = 'unloaded';
  private readyPromise: Promise<void> | null = null;
  
  init(): Promise<void> {
    if (this.readyPromise) {
      return this.readyPromise;
    }
    this.status = 'loading';
    this.readyPromise = new Promise(async (resolve, reject) => {
      try {
        this.model = await tf.loadGraphModel(MODEL_URL);
        const response = await fetch(LABELS_URL);
        this.labels = await response.json();
        // The warmup shape MUST be transposed to match the model's expectation
        const warmupResult = this.model.execute(tf.zeros([1, 3, 320, 320])) as tf.Tensor;
        tf.dispose(warmupResult);
        this.status = 'loaded';
        resolve();
      } catch (error) {
        this.status = 'failed';
        this.readyPromise = null;
        reject(error);
      }
    });
    return this.readyPromise;
  }

  async detectIngredients(imageSource: HTMLVideoElement | HTMLImageElement): Promise<Detection[]> {
    if (this.status !== 'loaded' || !this.model) {
      throw new Error('Model is not ready. Please wait.');
    }

    const outputTensor = tf.tidy(() => {
      const inputTensor = tf.browser.fromPixels(imageSource);
      
      const [height, width] = inputTensor.shape;
      const maxSize = Math.max(width, height);
      const hPad = maxSize - height;
      const wPad = maxSize - width;
      const paddingTop = Math.floor(hPad / 2);
      const paddingBottom = hPad - paddingTop;
      const paddingLeft = Math.floor(wPad / 2);
      const paddingRight = wPad - paddingLeft;
      
      const padded = tf.pad(inputTensor, [
        [paddingTop, paddingBottom],
        [paddingLeft, paddingRight],
        [0, 0]
      ]);

      const resized = tf.image.resizeBilinear(padded, [320, 320]);
      const normalized = resized.div(255.0);
      let batched = normalized.expandDims(0);

      // FIX #1: Add the transpose back in. The error proves the model needs it.
      batched = batched.transpose([0, 3, 1, 2]);

      const output = this.model!.execute(batched) as tf.Tensor | tf.Tensor[];
      return (Array.isArray(output) ? output[0] : output).clone();
    });

    // ... (The entire post-processing loop is the same as before)
    const predictions = await outputTensor!.data();
    const outputShape = outputTensor!.shape;
    const detectedObjects: Detection[] = [];

    // --- PASTE THE DEBUGGING CODE HERE ---
    let maxConfidence = 0;
    if (outputShape.length === 3) {
      const numPredictions = outputShape[1];
      const numElements = outputShape[2];
      for (let i = 0; i < numPredictions; i++) {
        const score = predictions[i * numElements + 4];
        if (score > maxConfidence) {
          maxConfidence = score;
        }
      }
    }
    console.log(`%cMax confidence score found: ${maxConfidence.toFixed(4)}`, 'color: orange; font-weight: bold;');
    // --- END OF DEBUGGING CODE --
    
    if (outputShape.length === 3 && outputShape[1] > 0 && outputShape[2] > 0) {
        const numPredictions = outputShape[1];
        const numElements = outputShape[2];
        const uniqueLabels = new Set<string>();

        for (let i = 0; i < numPredictions; i++) {
            const offset = i * numElements;
            const score = predictions[offset + 4];

            if (score > CONFIDENCE_THRESHOLD) {
                let maxProb = 0;
                let classId = -1;
                for (let j = 5; j < numElements; j++) {
                    const prob = predictions[offset + j];
                    if (prob > maxProb) {
                        maxProb = prob;
                        classId = j - 5;
                    }
                }

                if (classId > -1) {
                    const label = this.labels[classId];
                    if (label && !uniqueLabels.has(label)) {
                        detectedObjects.push({ label, confidence: score });
                        uniqueLabels.add(label);
                    }
                }
            }
        }
    } else {
        console.error("Unexpected output shape from model:", outputShape);
    }
    
    tf.dispose(outputTensor);
    return detectedObjects;
  }
}

export const yoloService = new YoloService();