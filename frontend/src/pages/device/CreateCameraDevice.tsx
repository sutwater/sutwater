import Content from '../../components/waterreq/CreateCameraDeviceContent';

interface CreateCameraDevicePageProps {
  setShowAddModal: (value: boolean) => void;
}

const CreateCameraDevicePage: React.FC<CreateCameraDevicePageProps> = ({ setShowAddModal }) => {

  return (
    <>
    <Content setShowAddModal={setShowAddModal}/>
    </>
  );
};

export default CreateCameraDevicePage;