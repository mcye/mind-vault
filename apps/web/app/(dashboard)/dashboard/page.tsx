export default function DashboardPage() {
    return (
        <div>
            <div className="mb-8 space-y-4">
                <h2 className="text-2xl md:text-4xl font-bold text-center md:text-left">
                    Welcome back
                </h2>
                <p className="text-muted-foreground font-light text-sm md:text-lg text-center md:text-left">
                    Explore the power of your AI Knowledge Base.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 占位卡片 */}
                <div className="p-6 border rounded-xl bg-card text-card-foreground shadow">
                    <h3 className="font-semibold">Total Documents</h3>
                    <p className="text-3xl font-bold mt-2">12</p>
                </div>
                <div className="p-6 border rounded-xl bg-card text-card-foreground shadow">
                    <h3 className="font-semibold">Messages Sent</h3>
                    <p className="text-3xl font-bold mt-2">1,024</p>
                </div>
            </div>
        </div>
    )
}