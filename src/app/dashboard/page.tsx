import { api } from "~/trpc/server";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { sharedStyles } from "../utils/shared-styles";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

import Dashboard from "../_components/dashboard";

const Bucket = process.env.AWS_S3_BUCKET_NAME;
const region = process.env.AWS_S3_REGION;
const s3 = new S3Client({
  region,
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY!,
  },
});

const uploadImage = async (formData: FormData): Promise<{ ok: boolean }> => {
  "use server";
  const files = formData.getAll("file") as File[];
  const fileType = formData.get("type") as string;

  return Promise.all(
    files.map(async (file) => {
      const Body = (await file.arrayBuffer()) as Buffer;
      await s3.send(
        new PutObjectCommand({
          Bucket,
          Key: file.name,
          Body,
          ContentType: fileType,
          ContentEncoding: "base64",
        }),
      );
    }),
  )
    .then(async (data) => {
      console.log("File upload successful!", data);
      const user = await currentUser();
      const photoName = files[0]!.name;
      const objectUrl = `https://${Bucket}.s3.${region}.amazonaws.com/${photoName}`;
      await api.website.updateCoverPhoto.mutate({
        userId: user?.id,
        coverPhotoUrl: objectUrl,
      });
      return { ok: true };
    })
    .catch((err) => {
      console.log("File upload failed. Error: ", err);
      return { ok: false };
    });
};

const deleteImage = async (imageKey: string): Promise<{ ok: boolean }> => {
  "use server";
  return new Promise((resolve) => {
    s3.send(
      new DeleteObjectCommand({
        Bucket: Bucket,
        Key: imageKey,
      }),
    )
      .then(async () => {
        const user = await currentUser();
        await api.website.updateCoverPhoto.mutate({
          userId: user?.id,
          coverPhotoUrl: null,
        });
        resolve({ ok: true });
      })
      .catch((err) => {
        console.log("File deletion failed. Error: ", err);
        resolve({ ok: false });
      });
  });
};

export default async function DashboardPage() {
  const dashboardData = await api.dashboard.getByUserId.query();

  if (dashboardData === null) {
    redirect("/");
  }

  return (
    <main
      className={`${sharedStyles.desktopPaddingSides} ${sharedStyles.minPageWidth}`}
    >
      <Dashboard
        dashboardData={dashboardData}
        uploadImage={uploadImage}
        deleteImage={deleteImage}
      />
    </main>
  );
}
