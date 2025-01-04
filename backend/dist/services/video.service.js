"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processVideoForHLS = void 0;
const fs_1 = __importDefault(require("fs"));
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
;
const resolutions = [
    { width: 1920, height: 1080, bitRate: 2000 }, // 1080p
    { width: 1280, height: 720, bitRate: 1000 }, // 720p
    { width: 854, height: 480, bitRate: 500 }, // 480p
    { width: 640, height: 360, bitRate: 400 }, // 360p
    { width: 256, height: 144, bitRate: 200 } // 144p
];
/**
 * Processes a video file for HTTP Live Streaming (HLS) and generates the necessary playlist files.
 *
 * @param inputPath - The path to the input video file.
 * @param outputPath - The path where the output HLS files should be saved.
 * @param callback - A callback function that is called when the processing is complete.
 *                    The callback receives an error object if an error occurred, and optionally the master playlist string.
 */
const processVideoForHLS = (inputPath, outputPath, callback) => {
    fs_1.default.mkdirSync(outputPath, { recursive: true }); // Create the output directory if it doesn't exist
    const masterPlaylist = `${outputPath}/master.m3u8`; // Path to the master playlist file
    const masterContent = []; // Content of the master playlist
    let countProcessing = 0; // Number of variants being processed
    resolutions.forEach((resolution) => {
        const variantOutput = `${outputPath}/${resolution.height}p`; // Path to the variant output file
        const variantPlaylist = `${variantOutput}/paylist.m3u8`; // Path to the variant media playlist file
        fs_1.default.mkdirSync(variantOutput, { recursive: true }); // Create the variant output directory if it doesn't exist
        (0, fluent_ffmpeg_1.default)(inputPath)
            .outputOptions([
            `-vf scale=w=${resolution.width}:h=${resolution.height}`,
            `-b:v ${resolution.bitRate}k`,
            '-codec:v libx264',
            '-codec:a aac',
            '-hls_time 10',
            '-hls_playlist_type vod',
            `-hls_segment_filename ${variantOutput}/segment%03d.ts`
        ])
            .output(variantPlaylist) // Output to the variant playlist file
            .on('end', () => {
            // When the processing ends, Add the variant playlist to the master playlist
            masterContent.push(`#EXT-X-STREAM_INF:BANDWIDTH=${resolution.bitRate * 1000},RESOLUTION=${resolution.width}x${resolution.height}\n${resolution.height}p/playlist.m3u8`);
            countProcessing += 1;
            if (countProcessing === resolutions.length) {
                console.log('Processing complete');
                // When all variants have been processed, write the master playlist
                fs_1.default.writeFileSync(masterPlaylist, `#EXTM3U\n${masterContent.join('\n')}`);
                callback(null, masterPlaylist); // Call the callback with the master playlist
            }
        })
            .on('error', (error) => {
            console.error('Error processing video:', error);
            callback(error); // Call the callback with an error
        })
            .run();
    });
};
exports.processVideoForHLS = processVideoForHLS;
