import { Request, Response } from 'express';
import { processVideoForHLS } from '../services/video.service';
import fs from 'fs';

export const uploadVideoController = async (req: Request, res: Response) => {
    if (!req.file) {
        res.status(400).json({
            success: false,
            message: 'No file uploaded'
        });
        return;
    }

    const videoPath = req.file.path;
    const ouputPath = `output/${Date.now()}`;

    processVideoForHLS(videoPath, ouputPath, (err, masterPlaylistPath) => {
        if (err) {
            res.status(500).json({
                success: false,
                message: 'Error processing video'
            });
            return;
        }

        fs.unlink(videoPath, (err) => {
            if (err) {
                console.error('Error deleting video file: ', err);
            }
        });

        res.status(200).json({
            success: true,
            message: 'Video processed successfully',
            data: `/${masterPlaylistPath}`
        })
    });
}