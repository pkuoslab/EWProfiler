package com.sei.server.component;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.TypeReference;
import com.sei.agent.Device;
import com.sei.bean.Collection.Graph.GraphAdjustor;
import com.sei.bean.Collection.Stack.FragmentStack;
import com.sei.bean.Collection.Tuple2;
import com.sei.bean.View.ViewTree;
import com.sei.modules.DFGraphStrategy;
import com.sei.modules.DepthFirstStrategy;
import com.sei.modules.ModelReplay;
import com.sei.modules.Strategy;
import com.sei.util.CommonUtil;
import com.sei.util.ConnectUtil;
import com.sei.util.SerializeUtil;
import com.sei.util.ShellUtils2;

import java.io.File;
import java.io.FileWriter;
import java.util.*;

public class Scheduler {
    Map<String, Device> devices;
    Map<String, FragmentStack> stacks;
    public GraphAdjustor graphAdjustor;
    Strategy[] strategys;

    Map<Tuple2<Integer, Integer>, Integer> ErrorLog;

    public Scheduler(String argv, Map<String, Device> devices){
        this.devices = devices;
        if (!argv.contains("-r"))
            stacks = load();
        graphAdjustor = new GraphAdjustor(argv);
        ErrorLog = new HashMap<>();
        strategys = new Strategy[]{new ModelReplay(graphAdjustor, devices),
                new DepthFirstStrategy(graphAdjustor, devices),
                new DFGraphStrategy(graphAdjustor, devices)};
        if (strategys == null){
            log("", "why???");
        }
    }

    public void bind(Device d){
        if (devices.containsKey(d.serial)){
            log(d.serial, " has not finished");
            return;
        }
        devices.put(d.serial, d);
        if (stacks == null)
            d.bind(this, graphAdjustor);
        else{
            d.bind(this, graphAdjustor, stacks.get(d.serial));
        }
    }

    public synchronized Decision update(String serial, ViewTree currentTree, ViewTree newTree, Decision prev_decision, int response){
        if (prev_decision.code == Decision.CODE.STOP){
            devices.remove(serial);
            return null;
        }
        Device d = devices.get(serial);
        if (d == null){
            return null;
        }
        return strategys[d.mode].make(serial, currentTree, newTree, prev_decision, response);
    }

    public void log(String serial, String info){
        CommonUtil.log("device #" + serial + ": " + info);
    }

    public void save(){
        try {
            CommonUtil.log("save stacks");
            String n = "stacks-" + ConnectUtil.launch_pkg + ".json";
            File file = new File(n);
            FileWriter writer = new FileWriter(file);
            Map<String, FragmentStack> stacks = new HashMap<>();
            for(String key : devices.keySet()) {
                stacks.put(key, devices.get(key).fragmentStack);
            }
            String content = SerializeUtil.toBase64(stacks);
            writer.write(content);
            writer.close();
        }catch(Exception e){
            e.printStackTrace();
        }
    }

    public Map<String, FragmentStack> load(){
        String n = "stacks-" + ConnectUtil.launch_pkg + ".json";
        File stackf = new File( n);
        if (!stackf.exists()) return null;
        String str = CommonUtil.readFromFile(n);
        Map<String, FragmentStack> stacks = JSON.parseObject(str, new TypeReference<Map<String, FragmentStack>>(){});
        CommonUtil.log("stack number: " + stacks.size());
        return stacks;
    }

}
