import TestEditor from "@/components/admin/TestEditor";

export default function NewTestPage() {
    return (
        <div className="py-10">
            <h1 className="text-3xl font-black mb-8 px-4">Create New Assessment</h1>
            <TestEditor />
        </div>
    );
}