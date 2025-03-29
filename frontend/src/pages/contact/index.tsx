import React from "react";
import "./index.css";
import { Button } from "antd";

const ContactPage: React.FC = () => {
  return (
    <div className="contact-container">
      <div className="contact-box">
        <div className="contact-section">
          <h3>ติดต่อ <span className="highlight">มหาวิทยาลัยเทคโนโลยีสุรนารี</span></h3>
          <p>
            111 ถนนมหาวิทยาลัย ตำบลสุรนารี อำเภอเมือง<br />
            จังหวัดนครราชสีมา 30000
          </p>
          <p>
            โทรศัพท์ 0-4422-3000<br />
            โทรสาร 0-4422-4070
          </p>
        </div>

        <div className="contact-section">
          <h3>ติดต่อ <span className="highlight">หน่วยประสานงาน มทส. กทม.</span></h3>
          <p>
            128/237 อาคารพญาไท พลาซ่า ชั้น 22 ถนนพญาไท เขตราชเทวี<br />
            จังหวัดกรุงเทพมหานคร 10400
          </p>
          <p>
            โทรศัพท์ 0-2216-5410, 0-2216-5493-4<br />
            โทรสาร 0-2216-5411
          </p>
        </div>

        <div className="contact-buttons">
          <Button type="default" className="outline-btn">SITEMAP</Button>
          <Button type="link" className="link-btn">TERM & CONDITIONS</Button>
        </div>
      </div>

      <div className="contact-footer">
        Copyright 2018 beta.sut.ac.th All Right Reserved.
      </div>
    </div>
  );
};

export default ContactPage;
