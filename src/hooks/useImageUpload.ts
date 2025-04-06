import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { config } from "../config/env";

/**
 * Convert a file to base64 string
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Hook for uploading images to items or assets
 * @param entityType "items" or "assets" - the type of entity to upload to
 */
export const useImageUpload = (entityType: "items" | "assets") => {
  return useMutation({
    mutationFn: async ({
      file,
      id,
    }: {
      file: File;
      id: string;
    }): Promise<string> => {
      try {
        // Convert file to base64
        const base64Data = await fileToBase64(file);

        // Extract only the base64 content (remove data:image/jpeg;base64, prefix)
        const base64Content = base64Data.split(",")[1];

        // Send as JSON instead of FormData
        const payload = {
          image: base64Content,
          filename: file.name,
          contentType: file.type
        };

        const baseUrl = config.API_URL.replace(/\/+$/, "");
        const url = `${baseUrl}/${entityType}/${id}/image`;

        console.log(`Uploading image to: ${url}`);

        const response = await axios({
          method: "patch",
          url,
          data: payload,
          headers: {
            "Content-Type": "application/json"
          }
        });

        return response.data.imageUrl;
      } catch (error) {
        console.error("Image upload error:", error);

        if (axios.isAxiosError(error) && error.response) {
          console.error("Image upload error details:", error.response.data);
        }

        throw error;
      }
    },
  });
};