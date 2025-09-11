import { Carousel } from "antd";

export default function HomeBanner() {
  return (
    <div className="content-wrapper">
      <Carousel autoplay effect="fade" dotPosition="bottom" pauseOnHover>
        <div>
          <img
            src="https://beta.sut.ac.th/wp-content/uploads/2022/09/banner-01-2-scaled.jpg"
            alt="SUT Banner 1"
            className="w-full h-auto max-h-[80vh] object-cover rounded-lg"
          />
        </div>
        <div>
          <img
            src="https://beta.sut.ac.th/wp-content/uploads/2022/09/sutbanner-01-scaled.jpg"
            alt="SUT Banner 2"
            className="w-full h-auto max-h-[80vh] object-cover rounded-lg"
          />
        </div>
      </Carousel>
    </div>
  );
}
