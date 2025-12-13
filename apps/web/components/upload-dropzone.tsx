"use client"

import { useCallback } from "react"

import { useDropzone } from "react-dropzone"
import { CloudUpload, File, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { client, apiFetch } from "@/lib/rpc"
import { useQueryClient, useMutation } from "@tanstack/react-query" // Add useMutation

export function UploadDropzone() {
    const queryClient = useQueryClient()
    const { mutate: handleUpload, isPending: isUploading } = useMutation({
        meta: {
            suppressError: true,
        },
        mutationFn: async (file: File) => {
            // 1. 获取上传链接
            const { url, key } = await apiFetch(
                client.uploads.presign.$post({
                    json: {
                        size: file.size,
                        filename: file.name,
                        contentType: file.type,
                    },
                })
            )

            // 2. 上传二进制文件到 R2
            const uploadRes = await fetch(url, {
                method: "PUT",
                body: file,
                headers: { "Content-Type": file.type },
            })
            if (!uploadRes.ok) throw new Error("Storage upload failed")

            // 3. 写入数据库元数据
            await apiFetch(
                client.documents.$post({
                    json: {
                        title: file.name,
                        storageKey: key,
                        size: file.size,
                        mimeType: file.type,
                        url: ""
                    }
                })
            )
        },
        onSuccess: () => {
            toast.success("Document uploaded & saved!")
            queryClient.invalidateQueries({ queryKey: ['documents'] })
        },
        onError: (error) => {
            console.error('Upload failed', error)
            toast.error(error.message)
        }
    })

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0]
        if (!file) return
        handleUpload(file)
    }, [handleUpload])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxFiles: 1,
        accept: {
            'application/pdf': ['.pdf'],
            'text/markdown': ['.md'],
            'text/plain': ['.txt']
        }
    })

    return (
        <div
            {...getRootProps()}
            className={`
        border-2 border-dashed rounded-lg p-10 transition-colors cursor-pointer
        flex flex-col items-center justify-center gap-4 text-center
        ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}
      `}
        >
            <input {...getInputProps()} />
            <div className="p-4 rounded-full bg-secondary">
                {isUploading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                ) : (
                    <CloudUpload className="h-8 w-8 text-primary" />
                )}
            </div>
            <div>
                <h3 className="font-semibold text-lg">
                    {isUploading ? "Uploading..." : "Click to upload or drag and drop"}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                    PDF, Markdown, or TXT (Max 10MB)
                </p>
            </div>
        </div>
    )
}