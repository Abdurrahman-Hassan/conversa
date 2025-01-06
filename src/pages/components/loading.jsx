import Image from "next/image";
import loading from "../../../public/loading.gif";
import style from "../../styles/loading.module.css";

const Loading = () => {
  return (
    <div className={style.loadingdiv}>
      <Image src={loading} width={100} height={100} alt="Loading" />
    </div>
  );
};

export default Loading;
