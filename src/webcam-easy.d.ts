declare module 'webcam-easy' {
  class Webcam {
    /**
     * @param {HTMLVideoElement} webcamElement The <video> element to stream the webcam to.
     * @param {'user' | 'environment'} facingMode The facing mode of the camera.
     * @param {HTMLCanvasElement} [canvasElement] The <canvas> element to use for snapping photos.
     * @param {HTMLAudioElement} [snapSoundElement] The <audio> element to play when a photo is snapped.
     */
    constructor(
      webcamElement: HTMLVideoElement,
      facingMode: 'user' | 'environment',
      canvasElement?: HTMLCanvasElement,
      snapSoundElement?: HTMLAudioElement
    );

    /** A boolean indicating if the webcam is currently started. */
    webcamStarted: boolean;

    /**
     * Starts the webcam stream.
     * @returns {Promise<void>} A promise that resolves when the webcam has started.
     */
    start(): Promise<void>;

    /**
     * Stops the webcam stream.
     */
    stop(): void;

    /**
     * Snaps a photo from the webcam stream.
     * @returns {string} The base64 data URL of the snapped photo.
     */
    snap(): string;

    /**
     * Flips the camera to the next available one.
     */
    flip(): void;
  }

  export default Webcam;
}