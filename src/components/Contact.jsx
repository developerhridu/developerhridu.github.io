import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import emailjs from "@emailjs/browser";

import { styles } from "../styles";
import { EarthCanvas } from "./canvas";
import { SectionWrapper } from "../hoc";
import { slideIn } from "../utils/motion";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Contact = () => {
  const formRef = useRef();
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
      mobile: ""

  });

  const [loading, setLoading] = useState(false);

  const handelChange = (event) => {
    const { name, value } = event.target;
    setForm({ ...form, [name]: value });
  };
    const handelSubmit = (event) => {
        event.preventDefault();

        const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
        const mobileRegex = /^[0-9\b]+$/;

        let isValidData = true;

        if (!form.email && !form.message) {
            isValidData = false;
            toast.warning('Email & Message is required.');
            return;
        }
        if (!form.email) {
            isValidData = false;
            toast.warning('Email is required.');
            return;
        }
        if (!form.message) {
            isValidData = false;
            toast.warning('Message is required.');
            return;
        }

        if (!emailRegex.test(form.email)) {
            toast.warning('Please enter a valid email address.');
            isValidData = false;
            return;
        }

        if(form.mobile.length > 0){
            if (!mobileRegex.test(form.mobile)) {
                toast.warning('Please enter a valid mobile number.');
                return;
            }
        }

        setLoading(true);

        const templateParams = {
            user_name: form.name,
            to_name: "Hridu",
            user_email: form.email,
            from_email: form.email,
            contact_number: form.mobile,
            message: form.message,
        };

        if(isValidData)
        {
            emailjs
                .send(
                    "service_p90g8lb",
                    "template_l2ewgfe",
                    templateParams,
                    "9CTVxuzxL-4ARdEn_"
                )
                .then(
                    () => {
                        setLoading(false);
                        toast.success(`Hey ${form.name}! I will get back to you as soon as possible.`);

                        setForm({
                            name: "",
                            email: "",
                            message: "",
                            mobile: "",
                        });
                    },
                    (error) => {
                        setLoading(false);
                        toast.error('Ahh, something went wrong. Please try again.');
                    }
                );

        }
        else {
            toast.error('Please Fill the form with vaild data and Please try again.');

        }
    };



    return (
    <div className="xl:mt-12 xl:flex-row flex-col-reverse flex gap-10 overflow-hidden">
      <motion.div
        variants={slideIn("left", "tween", 0.2, 1)}
        className="flex-[0.75] bg-black-100 p-8 rounded-2xl"
      >
        <p className={styles.sectionSubText}>Get in touch</p>
        <h3 className={styles.sectionHeadText}>Contact.</h3>

        <form
          ref={formRef}
          onSubmit={handelSubmit}
          className="mt-12 flex flex-col gap-8"
        >
          <label className="flex flex-col">
            <span className="text-white font-medium mb-4">Your Name.</span>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handelChange}
              placeholder="What's your name?"
              className="bg-tertiary py-4 px-6 placeholder:text-secondary text-white rounded-lg outlined-none border-none font-medium"
            />
          </label>

          <label className="flex flex-col">
            <span className="text-white font-medium mb-4">Your Email.</span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handelChange}
              placeholder="What's your email?"
              className="bg-tertiary py-4 px-6 placeholder:text-secondary text-white rounded-lg outlined-none border-none font-medium"
            />
          </label>
            <label className="flex flex-col">
                <span className="text-white font-medium mb-4">Your Mobile Number.</span>
                <input
                    type="number"
                    pattern="[0-9]*"
                    name="mobile"
                    value={form.mobile}
                    onChange={handelChange}
                    placeholder="What's your mobile number?"
                    className="bg-tertiary py-4 px-6 placeholder:text-secondary text-white rounded-lg outlined-none border-none font-medium"
                />
            </label>
          <label className="flex flex-col">
            <span className="text-white font-medium mb-4">Your Message.</span>
            <textarea
              rows={7}
              type="message"
              name="message"
              value={form.message}
              onChange={handelChange}
              placeholder="What do want to say?"
              className="bg-tertiary py-4 px-6 placeholder:text-secondary text-white rounded-lg outlined-none border-none font-medium"
            />
          </label>

          <button
            type="submit"
            className="bg-tertiary py-3 px-8 outline-none w-fit text-white font-bold shadow-md shadow-primary rounded-xl"
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </form>
      </motion.div>

      <motion.div
        variants={slideIn("right", "tween", 0.2, 1)}
        className="xl:flex-1 xl:h-auto md:h-[550px] h-[350px]"
      >
        <EarthCanvas />
      </motion.div>
    </div>
  );
};

export default SectionWrapper(Contact, "contact");
