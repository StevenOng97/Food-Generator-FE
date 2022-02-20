import "./style.scss";
import logo from "../assets/food-logo.jpeg";
import { useEffect, useState } from "react";
import axios from "axios";
import { encode } from "base64-arraybuffer";
import Modal from "react-modal";
import { RingLoader } from "react-spinners";
import { saveAs } from "file-saver";
import { DebounceInput } from "react-debounce-input";

interface Food {
  _id: string;
  title: string;
  image?: any;
}

const Container = () => {
  const [contentInput, setContentInput] = useState<string | null>(null);
  const [modalIsOpen, setIsOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [image, setImage] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [isDisplay, setDisplay] = useState<boolean>(false);
  const [index, setIndex] = useState<number>(0);
  const [suggestionIndex, setSuggestionIndex] = useState<number>(0);
  const [suggestionFood, setSuggestionFood] = useState<Food[]>([]);
  const [isAutoComplete, setAutoComplete] = useState<boolean>(false);
  const placeholder = "Enter a food name";

  const fetchApi = (id: string = ""): Promise<any> => {
    const apiUrl = "https://food-generator-server.herokuapp.com";
    // const apiUrl = 'http://localhost:8080'
    let endpoint = `${apiUrl}/food`;

    if (id) {
      endpoint += `/${id}`;
      return axios.get(endpoint);
    }

    if (contentInput) {
      endpoint += `?title=${contentInput}`;
    }

    return axios.get(endpoint);
  };

  useEffect(() => {
    if (contentInput === null) return;
    !isAutoComplete && getFoods(contentInput);
  }, [contentInput]);

  const getFoods = async (value: string) => {
    setLoading(true);
    fetchApi()
      .then((res: any) => {
        const { data = {} } = res;
        setLoading(false);
        let matches = [];
        if (contentInput) {
          matches = data.filter((food: Food) => {
            const regex = new RegExp(`${value}`, "gi");
            return food.title.match(regex);
          });
        }
        setDisplay(true);
        setSuggestionFood(matches);
      })
      .catch((err) => {
        setLoading(false);
        if (err.response) {
          const { status = 0 } = err.response;
          if (status === 404) {
            setSuggestionFood([]);
          }
        }
      });
  };

  const getFood = async (i: number = 0) => {
    setLoading(true);

    if (suggestionFood.length === 0) {
      setErrorMessage("There is no food that matches your request!");
      setIsOpen(true);
      setLoading(false);
      return;
    }

    const _id = suggestionFood[i]._id;
    fetchApi(_id)
      .then((res: any) => {
        const arrayBuffer = res.data.image.data;
        const base64String = encode(arrayBuffer);
        setLoading(false);

        setIndex(index + 1);
        setImage(base64String);
        setTitle(res.data.title);
        setDisplay(false);
        setSuggestionFood([]);
        setContentInput(null);
        setAutoComplete(false);
      })
      .catch((err) => {
        setLoading(false);

        if (err.response) {
          const { data: { message = "" } = {}, status = 0 } = err.response;
          if (status === 404) {
            setErrorMessage(message);
            setIsOpen(true);
          }
        }
      });
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const handleEnter = (e: any) => {
    if (e.key === "Enter" && !loading) {
      if (suggestionFood.length > 0) {
        if (
          contentInput &&
          contentInput.length < suggestionFood[0].title.length
        ) {
          setContentInput(suggestionFood[0].title);
          setAutoComplete(true);
          setDisplay(false);
        }
      }
      getFood();
    }
  };

  const b64toBlob = (
    b64Data: string,
    contentType = "",
    sliceSize = 512
  ): Blob => {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);

      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: contentType });
    return blob;
  };

  const downloadImage = () => {
    const fileName = title;
    const blob = b64toBlob(image, "image/png");
    saveAs(blob, fileName);
  };

  const customStyles = {
    overlay: {
      backgroundColor: "rgba(255, 255, 255, 0.5)",
    },
    content: {
      top: "50%",
      left: "50%",
      right: "auto",
      bottom: "auto",
      marginRight: "-50%",
      transform: "translate(-50%, -50%)",
      minWidth: "30%",
      textAlign: "center" as const,
    },
  };

  const override = "display: block; margin: 0 auto;";
  const wrapperClassName = loading ? "app-wrapper disabled" : "app-wrapper";

  // console.log("Render", suggestionFood.length > 0 && isDisplay);
  console.log(
    "suggestion condition",
    suggestionFood,
    suggestionFood.length > 0
  );
  // console.log("display condition", isDisplay);
  return (
    <div className={wrapperClassName}>
      <div className="header bg-primary p-3 d-flex align-items-center justify-content-start">
        <div className="logo-wrapper">
          <img src={logo} className="logo" alt="logo" />
        </div>
        <h3 className="title text-white ms-2 mb-0">Food founder</h3>
      </div>
      <div className="content bg-white p-4">
        <div className="content-wrapper container">
          <DebounceInput
            className="form-control"
            type="text"
            disabled={loading}
            onChange={(e) => {
              if (!isDisplay && suggestionFood.length > 0) {
                setDisplay(true);
              }
              setContentInput(e.target.value);
            }}
            value={contentInput || ""}
            placeholder={placeholder}
            onKeyDown={handleEnter}
            debounceTimeout={200}
            onClick={() => {
              if (suggestionFood.length > 0) {
                setDisplay(!isDisplay);
              }
            }}
            onBlur={() => {
              setTimeout(() => {
                setDisplay(false);
              }, 200);
            }}
          />
          {suggestionFood.length > 0 && isDisplay && (
            <div className="autoContainer position-relative">
              {suggestionFood.map((food: any, i) => {
                return (
                  <div
                    key={i}
                    className="option"
                    onClick={() => {
                      setContentInput(food.title);
                      setDisplay(false);
                      setAutoComplete(true);
                      setSuggestionIndex(i);
                      getFood(i)
                    }}
                  >
                    <span>{food.title}</span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="text-center w-100">
            <button
              className="btn btn-primary mt-3 w-50"
              onClick={() => getFood(suggestionIndex)}
              disabled={!contentInput}
            >
              {loading ? (
                <RingLoader
                  size={30}
                  color={"#fff"}
                  loading={loading}
                  css={override}
                />
              ) : (
                <span>Get a new food image</span>
              )}
            </button>
          </div>
          {image && (
            <div className="card-wrapper">
              <img
                key={index}
                src={`data:image/png;base64,${image} `}
                className="food-image fade-in-image"
                alt="food"
              />
              <div className="image__overlay" onClick={downloadImage}>
                <h5 className="mb-0">Download</h5>
              </div>
              <p className="title mb-0 text-center">{title}</p>
            </div>
          )}
        </div>
      </div>
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        style={customStyles}
        contentLabel="Example Modal"
        ariaHideApp={false}
      >
        <h2>Sorry!</h2>
        <p className="text-danger">{errorMessage}</p>

        <button onClick={closeModal} className="custom-btn btn btn-secondary">
          Close
        </button>
      </Modal>
    </div>
  );
};

export default Container;
