import { DocumentsList } from "@/components/documents-list"
import { UploadDropzone } from "@/components/upload-dropzone"

export default function DocumentsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Knowledge Base</h2>
                <p className="text-muted-foreground">
                    Upload documents to train your AI brain.
                </p>
            </div>

            {/* 上传区域 */}
            <UploadDropzone />

            <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    Library
                </h3>

                {/* 列表区域 */}
                <DocumentsList />
            </div>
        </div>
    )
}