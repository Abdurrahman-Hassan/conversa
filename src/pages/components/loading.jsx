import Image from "next/image";
import loading from "../../../public/loading.gif";

const Loading = () => {
  return (
    <div className="flex justify-center items-center h-full">
      <Image src={loading} width={120} height={120} alt="Loading" />
    </div>
  );
};

export default Loading;
