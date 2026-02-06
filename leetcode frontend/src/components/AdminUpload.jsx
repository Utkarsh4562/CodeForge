import { useParams } from 'react-router';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import axiosClient from '../utils/axiosClient';

function AdminUpload(){

    const {problemId} = useParams();

    const [uploading, setUploading] = useState(false); // it will just check is my video is uploading or not and once my video get uploaded then i will false the uploading state
    const [uploadProgress, setUploadProgress] = useState(0); // it will show the progress of my video upload in progress bar in percentage
    const [uploadedVideo, setUploadedVideo] = useState(null); // it will store the uploaded video metadata after successfull upload

    const {  // here we have just created react hook form
        register,
        handleSubmit,
        watch,
        formState: { errors },
        reset,
        setError,
        clearErrors
    } = useForm();

    const selectedFile = watch('videoFile')?.[0]; // it will watch the input field with name videoFile and get the first file from the array of files

    // upload video to cloudinary
    const onSubmit = async (data) => {
        const file = data.videoFile[0];

        setUploading(true);
        setUploadProgress(0);
        clearErrors();

        try {
            // step 1: Get upload signature from backend
            const signatureResponse = await axiosClient.get(`/video/create/${problemId}`);
            const { signature, timestamp, public_id, api_key, cloud_name, upload_url } = signatureResponse.data;

            // step 2: create FormData for cloudinary upload
            const formData = new FormData();
            formData.append('file', file);
            formData.append('signature',signature);
            formData.append('timestamp',timestamp);
            formData.append('public_id',public_id);
            formData.append('api_key',api_key);

            // upload directly to cloudinary
            const uploadResponse = await axios.post(upload_url, formData, {
                headers:{
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const progress = Math.round((progressEvent.loaded*100)/progressEvent.total);
                    setUploadProgress(progress);
                },
            });

            const cloudinaryResult = uploadResponse.data;

            // save video metadata to backend
            const metadataResponse = await axiosClient.post('/video/save',{
                problemId:problemId,
                cloudinaryPublicId:cloudinaryResult.public_id,
                secureUrl: cloudinaryResult.secure_url,
                duration: cloudinaryResult.duration,
            });

            setUploadedVideo(metadataResponse.data.videoSolution);

            reset(); // rreset form after successfull upload
        }
        catch(err){
            console.error('upload error', err);
            setError('root',{
                type:'manual',
                message: err.response?.data?.message || 'upload failed. Please try again.'
            });
        }
        finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    //format file size
    const formatFileSize = (bytes)=>{
        if(bytes===0) return '0 bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes)/Math.log(k));
        return parseFloat((bytes / Math.pow(k,i)).toFixed(2))+ ' ' + sizes[i];
    };

    // format duration
    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="max-w-md mx-auto p-6">
            <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                    <h2 className="card-title">Upload Video</h2>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                        {/* File Input*/}
                        <div className="form-control w-full">
                            <label className="label">
                                <span className="label-text">Choose video file</span>
                            </label>

                            <input
                                type="file"
                                accept="video/*"
                                {...register('videoFile',{
                                    required: 'please select a video file ',
                                    validate:{
                                        isVideo:(files) => {
                                            if(!files || !files[0]) return 'please select a video file';
                                            const file = files[0];
                                            return file.type.startsWith('video/') || 'Please select a valid video file ';
                                        },
                                        fileSize: (files) =>{
                                            if (!files || !files[0]) return true ;
                                            const file = files[0];
                                            const maxSize = 100* 1024 * 1024; // 100 MB
                                            return file.size<= maxSize || 'file size must be less than 100 MB ';
                                        }
                                    }
                                })}
                                className={`file-input file-input-bordered w-full ${errors.videoFile ? 'file-input-error' : ''}`}
                                disabled={uploading}
                            />

                            {errors.videoFile && (
                                <label className="label">
                                    <span className="label-text-alt text-error">{errors.videoFile.message}</span>
                                </label>
                            )}
                        </div>

                        {/* selected files info*/}
                        {selectedFile && (
                            <div className="alert alert-info">
                                <div>
                                    <h3 className="font-bold">Selected File:</h3>
                                    <p className="text-sm">Size: {formatFileSize(selectedFile.size)}</p>
                                </div>
                            </div>
                        )}

                        {/* upload progress*/}
                        {uploading && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span> uploading...</span>
                                    <span>{uploadProgress}%</span>
                                </div>
                                <progress
                                    className="progress progress-primary w-full"
                                    value={uploadProgress}
                                    max="100"
                                ></progress>
                            </div>
                        )}

                        {/* Error message */}
                        {errors.root && (
                            <div className="alert alert-error">
                                <span>{errors.root.message}</span>
                            </div>
                        )}

                        {/* success message*/}
                        {uploadedVideo && (
                            <div className="alert alert-success">
                                <div>
                                    <h3 className="font-bold">Upload SuccessFul!</h3>
                                    <p className="text-sm">Duration: {formatDuration(uploadedVideo.duration)}</p>
                                    <p className="text-sm">Uploaded: {new Date(uploadedVideo.uploadedAt).toLocaleString()}</p>
                                </div>
                            </div>
                        )}

                        {/* upload button*/}
                        <div className="card-actions justify-end">
                            <button
                                type="submit"
                                disabled={uploading}
                                className={`btn btn-primary ${uploading ? 'loading' : ''}`}
                            >
                                {uploading ? 'uploading...' : 'upload Video'}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}

export default AdminUpload;
