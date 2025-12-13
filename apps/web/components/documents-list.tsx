"use client"

import { useQuery } from "@tanstack/react-query"
import { client, apiFetch } from "@/lib/rpc"
import { FileText, Clock, AlertCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export function DocumentsList() {
    const { data: docs, isLoading } = useQuery({
        queryKey: ['documents'],
        queryFn: () => apiFetch(client.documents.$get())
    })

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
            </div>
        )
    }

    if (!docs || docs.length === 0) {
        return (
            <div className="p-8 text-center border rounded-lg bg-muted/10 text-muted-foreground">
                No documents uploaded yet.
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {docs.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg bg-card shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-md">
                            <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h4 className="font-medium truncate max-w-[200px] md:max-w-[400px]">{doc.title}</h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <span>{(doc.size / 1024 / 1024).toFixed(2)} MB</span>
                                <span>•</span>
                                <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {doc.status === 'pending' && (
                            <span className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500 px-2 py-1 rounded-full">
                                <Clock className="h-3 w-3" /> Indexing
                            </span>
                        )}
                        {doc.status === 'indexed' && (
                            <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500 px-2 py-1 rounded-full">
                                Ready
                            </span>
                        )}
                        {doc.status === 'failed' && (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}