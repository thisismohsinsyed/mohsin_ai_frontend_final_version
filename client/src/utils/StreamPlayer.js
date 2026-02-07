"use client";

export class StreamPlayer {
    constructor(sampleRate = 16000, options = {}) {
        this.sampleRate = sampleRate;
        this.audioContext = null;
        this.nextStartTime = 0;
        this.isPlaying = false;
        this.activeSources = new Set();
        this.onPlaybackStart = options.onPlaybackStart;
        this.onPlaybackComplete = options.onPlaybackComplete;
    }

    setCallbacks({ onPlaybackStart, onPlaybackComplete } = {}) {
        this.onPlaybackStart = onPlaybackStart;
        this.onPlaybackComplete = onPlaybackComplete;
    }

    ensureContext() {
        if (!this.audioContext) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext({ sampleRate: this.sampleRate });
            this.nextStartTime = this.audioContext.currentTime;
        } else if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    feed(data) {
        this.ensureContext();

        let float32Data;

        if (data instanceof ArrayBuffer || data instanceof Int8Array || data instanceof Uint8Array) {
            const buffer = data instanceof ArrayBuffer ? data : data.buffer;
            const int16 = new Int16Array(buffer, data.byteOffset, data.byteLength / 2);
            float32Data = this.convertInt16ToFloat32(int16);
        } else if (data instanceof Int16Array) {
            float32Data = this.convertInt16ToFloat32(data);
        } else if (data instanceof Float32Array) {
            float32Data = data;
        } else {
            console.warn("StreamPlayer: Unsupported data type", data);
            return;
        }

        this.scheduleBuffer(float32Data);
    }

    convertInt16ToFloat32(int16Data) {
        const float32 = new Float32Array(int16Data.length);
        for (let i = 0; i < int16Data.length; i++) {
            float32[i] = int16Data[i] / 32768.0;
        }
        return float32;
    }

    scheduleBuffer(float32Data) {
        const buffer = this.audioContext.createBuffer(1, float32Data.length, this.sampleRate);
        buffer.getChannelData(0).set(float32Data);

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioContext.destination);

        const currentTime = this.audioContext.currentTime;
        if (this.nextStartTime < currentTime) {
            this.nextStartTime = currentTime;
        }

        source.start(this.nextStartTime);
        this.nextStartTime += buffer.duration;
        this.registerSource(source);
    }

    registerSource(source) {
        this.activeSources.add(source);
        if (!this.isPlaying) {
            this.isPlaying = true;
            if (typeof this.onPlaybackStart === 'function') {
                this.onPlaybackStart();
            }
        }

        source.onended = () => {
            this.activeSources.delete(source);
            if (this.activeSources.size === 0) {
                this.isPlaying = false;
                if (typeof this.onPlaybackComplete === 'function') {
                    this.onPlaybackComplete();
                }
            }
        };
    }

    stop() {
        this.activeSources.forEach((source) => {
            try {
                source.stop();
            } catch (err) {
                console.warn('StreamPlayer: unable to stop source', err);
            }
        });
        this.activeSources.clear();

        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        this.nextStartTime = 0;

        if (this.isPlaying && typeof this.onPlaybackComplete === 'function') {
            this.onPlaybackComplete();
        }
        this.isPlaying = false;
    }
}
