import React from "react";
import "./ContactBlock.css";

const ContactBlock: React.FC = () => {

  return (
    <div className="contactblock-container">
      <div className="contactblock-box">
        <div className="contactblock-section">
          <h3>
            ติดต่อ <span className="contactblock-highlight">มหาวิทยาลัยเทคโนโลยีสุรนารี</span>
          </h3>
          <p>
            111 ถนนมหาวิทยาลัย ตำบลสุรนารี อำเภอเมือง<br />
            จังหวัดนครราชสีมา 30000
          </p>
          <p>
            โทรศัพท์ 0-4422-3000<br />
            โทรสาร 0-4422-4070
          </p>
        </div>
        <div className="contactblock-section">
          <h3>
            ติดต่อ <span className="contactblock-highlight">หน่วยประสานงาน มทส. กทม.</span>
          </h3>
          <p>
            128/237 อาคารพญาไท พลาซ่า ชั้น 22 ถนนพญาไท เขตราชเทวี<br />
            จังหวัดกรุงเทพมหานคร 10400
          </p>
          <p>
            โทรศัพท์ 0-2216-5410, 0-2216-5493-4<br />
            โทรสาร 0-2216-5411
          </p>
        </div>
      </div>
      <div className="contactblock-footer">
        Copyright 2018 beta.sut.ac.th All Right Reserved.
      </div>
    </div>
  );
};

export default ContactBlock;
