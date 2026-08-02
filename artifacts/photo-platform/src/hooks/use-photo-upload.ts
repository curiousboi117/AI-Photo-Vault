import { useCallback, useState } from "react";
import { useRequestUploadUrl, useCreatePhoto } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListPhotosQueryKey, getGetPhotoTimelineQueryKey, getGetPhotoStatsQueryKey } from "@workspace/api-client-react";

export function usePhotoUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const requestUrl = useRequestUploadUrl();
  const createPhoto = useCreatePhoto();
  const queryClient = useQueryClient();

  const uploadFile = useCallback(async (file: File) => {
    try {
      setIsUploading(true);
      setProgress(10);

      // 1. Request presigned URL
      const { uploadURL, objectPath } = await requestUrl.mutateAsync({
        data: {
          name: file.name,
          size: file.size,
          contentType: file.type,
        }
      });

      setProgress(40);

      // 2. PUT file directly to GCS
      const uploadRes = await fetch(uploadURL, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload to storage");
      }

      setProgress(80);

      // Extract basic image dimensions if possible (optional but good for masonry)
      let width = 800;
      let height = 600;
      try {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        await new Promise((resolve) => {
          img.onload = () => {
            width = img.width;
            height = img.height;
            URL.revokeObjectURL(img.src);
            resolve(true);
          }
        });
      } catch (e) {
        // ignore dimension errors
      }

      // 3. Register photo in DB
      const photo = await createPhoto.mutateAsync({
        data: {
          filename: file.name,
          objectPath: objectPath,
          mimeType: file.type,
          fileSize: file.size,
          width,
          height
        }
      });

      setProgress(100);

      // 4. Invalidate queries
      queryClient.invalidateQueries({ queryKey: getListPhotosQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetPhotoTimelineQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetPhotoStatsQueryKey() });

      return photo;
    } catch (error) {
      console.error("Upload failed:", error);
      throw error;
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  }, [requestUrl, createPhoto, queryClient]);

  return { uploadFile, isUploading, progress };
}
